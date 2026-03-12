import { UserRole } from '../types';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash';

// Rate limiter: max 14 req/min (marge sur la limite gratuite de 15)
const RATE_LIMIT = 14;
const RATE_WINDOW_MS = 60_000;
const requestTimestamps: number[] = [];

function checkRateLimit(): boolean {
  const now = Date.now();
  // Purge les timestamps hors fenêtre
  while (requestTimestamps.length > 0 && requestTimestamps[0] < now - RATE_WINDOW_MS) {
    requestTimestamps.shift();
  }
  if (requestTimestamps.length >= RATE_LIMIT) {
    return false;
  }
  requestTimestamps.push(now);
  return true;
}

// System prompts adaptés au rôle
const SYSTEM_PROMPTS: Record<UserRole, string> = {
  client: `Tu es ZopAssistant, l'assistant IA de l'application ZopGo, une plateforme de transport et services en Afrique.
Tu aides les CLIENTS à :
- Réserver des voyages inter-villes (bus, covoiturage)
- Commander des livraisons de colis
- Trouver et réserver des hébergements (hôtels, auberges, appartements)
- Louer des véhicules
- Comprendre les tarifs et promotions
- Résoudre des problèmes avec leurs commandes

Réponds toujours en français, de manière concise et amicale. Si tu ne connais pas une information spécifique (prix exact, disponibilité en temps réel), dis-le clairement et suggère de vérifier dans l'application.`,

  chauffeur: `Tu es ZopAssistant, l'assistant IA de l'application ZopGo, une plateforme de transport et services en Afrique.
Tu aides les TRANSPORTEURS à :
- Créer et gérer leurs trajets (départ, arrivée, prix, places)
- Optimiser leurs tarifs pour être compétitifs
- Comprendre le système de notation et améliorer leur score
- Suivre leurs revenus et statistiques
- Gérer leur disponibilité et leur profil
- Résoudre des problèmes techniques avec l'application

Réponds toujours en français, de manière concise et professionnelle. Donne des conseils pratiques pour maximiser les revenus.`,

  hebergeur: `Tu es ZopAssistant, l'assistant IA de l'application ZopGo, une plateforme de transport et services en Afrique.
Tu aides les HÉBERGEURS à :
- Créer et gérer leurs annonces de logements
- Fixer des tarifs compétitifs selon la saison et la localisation
- Gérer le taux d'occupation et les réservations
- Répondre aux avis des clients et améliorer leur notation
- Optimiser la visibilité de leurs annonces
- Résoudre des problèmes techniques avec l'application

Réponds toujours en français, de manière concise et professionnelle. Donne des conseils pour améliorer l'attractivité des logements.`,
};

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

function buildRequestBody(messages: ChatMessage[], userRole: UserRole) {
  // Limiter aux 20 derniers messages pour le contexte
  const recentMessages = messages.slice(-20);

  return {
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPTS[userRole] }],
    },
    contents: recentMessages,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  };
}

export type StreamCallback = (chunk: string) => void;

// Streaming via SSE (pour environnements supportant ReadableStream)
async function streamGenerate(
  messages: ChatMessage[],
  userRole: UserRole,
  onChunk: StreamCallback,
  signal?: AbortSignal
): Promise<string> {
  const url = `${BASE_URL}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;
  const body = buildRequestBody(messages, userRole);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errorText}`);
  }

  // Parse SSE stream
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('ReadableStream not supported');
  }

  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    // Garder la dernière ligne (potentiellement incomplète) dans le buffer
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6).trim();
        if (!jsonStr) continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            fullText += text;
            onChunk(text);
          }
        } catch {
          // Ignorer les lignes JSON invalides
        }
      }
    }
  }

  return fullText;
}

// Fallback non-streaming (pour Hermes/environnements sans ReadableStream)
async function generateFallback(
  messages: ChatMessage[],
  userRole: UserRole,
  signal?: AbortSignal
): Promise<string> {
  const url = `${BASE_URL}:generateContent?key=${GEMINI_API_KEY}`;
  const body = buildRequestBody(messages, userRole);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Réponse vide de Gemini');
  }
  return text;
}

// Vérifier si le streaming est supporté
function isStreamingSupported(): boolean {
  try {
    return typeof ReadableStream !== 'undefined';
  } catch {
    return false;
  }
}

/**
 * Envoie un message à Gemini et retourne la réponse.
 * Utilise le streaming si supporté, sinon fallback.
 */
export async function sendMessage(
  messages: ChatMessage[],
  userRole: UserRole,
  onChunk?: StreamCallback,
  signal?: AbortSignal
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('Clé API Gemini manquante. Configurez EXPO_PUBLIC_GEMINI_API_KEY dans .env');
  }

  if (!checkRateLimit()) {
    throw new Error('Trop de messages envoyés. Veuillez patienter quelques secondes.');
  }

  // Tenter le streaming si supporté et callback fourni
  if (onChunk && isStreamingSupported()) {
    try {
      return await streamGenerate(messages, userRole, onChunk, signal);
    } catch (err) {
      // Si l'erreur est liée au streaming, fallback
      if (err instanceof Error && err.message.includes('ReadableStream')) {
        const result = await generateFallback(messages, userRole, signal);
        onChunk(result);
        return result;
      }
      throw err;
    }
  }

  // Fallback non-streaming
  const result = await generateFallback(messages, userRole, signal);
  if (onChunk) onChunk(result);
  return result;
}
