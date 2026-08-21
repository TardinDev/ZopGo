/**
 * Invitations Clerk pilotées depuis l'admin web.
 *
 * POURQUOI CETTE FONCTION EXISTE
 * Créer un compte par invitation exige `CLERK_SECRET_KEY`. Une clé secrète ne
 * peut pas vivre dans un bundle navigateur : tout visiteur de l'admin
 * pourrait la lire dans les sources et créer des comptes à volonté, avec
 * n'importe quel rôle. La clé reste donc ici, et le navigateur ne fait que
 * demander.
 *
 * AUTORISATION
 * Déployée avec `verify_jwt = false` (voir supabase/config.toml) : le gateway
 * ne sait pas valider le jeton HS256 du template Clerk `supabase` que présente
 * l'admin web, et rejetterait 100 % des appels avant le handler. La fonction
 * autorise donc elle-même, via `_shared/adminAuth.ts` — même contrôle que les
 * policies, sur le même claim `admin_role`.
 *
 * ORDRE DES CONTRÔLES
 * L'autorisation passe AVANT la vérification de `CLERK_SECRET_KEY`. Un
 * appelant anonyme reçoit 403 et n'apprend rien de la configuration du
 * projet : lui répondre 500 « secret manquant » lui confirmerait à la fois
 * l'existence de l'endpoint et son état d'installation.
 */

import { isAdminCaller } from '../_shared/adminAuth.ts';

const CLERK_SECRET_KEY = Deno.env.get('CLERK_SECRET_KEY');

const CLERK_API = 'https://api.clerk.com/v1/invitations';

// ─── CORS / helpers de réponse ─────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

/**
 * Extrait un message lisible d'une erreur Clerk.
 *
 * L'API renvoie `{ errors: [{ message, long_message, code }] }`. Ce message
 * est utile à l'admin — « cette adresse est déjà inscrite » lui dit quoi
 * faire, là où un « échec de l'invitation » générique le laisse relancer en
 * boucle. On préfère `long_message`, plus explicite, quand il est présent.
 */
function messageErreurClerk(payload: unknown, statut: number): string {
  const errs = (payload as { errors?: Array<Record<string, unknown>> } | null)?.errors;
  if (Array.isArray(errs) && errs.length > 0) {
    const messages = errs
      .map((e) => (e.long_message ?? e.message) as string | undefined)
      .filter((m): m is string => typeof m === 'string' && m.length > 0);
    if (messages.length > 0) return messages.join(' ');
  }
  return `Clerk a refusé la requête (HTTP ${statut}).`;
}

/** Appel authentifié à l'API Clerk, avec parsing tolérant du corps. */
async function appelClerk(
  url: string,
  init: RequestInit = {}
): Promise<{ ok: boolean; statut: number; corps: unknown }> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  // Une réponse Clerk vide ou non-JSON ne doit pas faire tomber le handler
  // dans le catch générique : on veut relayer le statut, pas une erreur de
  // parsing sans rapport.
  let corps: unknown = null;
  try {
    corps = await res.json();
  } catch {
    corps = null;
  }

  return { ok: res.ok, statut: res.status, corps };
}

// ─── Handler HTTP ──────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  // 403 avant tout le reste : voir « ORDRE DES CONTRÔLES » en tête de
  // fichier. Aucun détail sur la cause — jeton absent, expiré, signé mais
  // sans `admin_role` : la réponse est la même.
  if (!(await isAdminCaller(req))) {
    return json({ error: 'Accès refusé.' }, 403);
  }

  if (!CLERK_SECRET_KEY) {
    console.error(
      '[admin-invitations] CLERK_SECRET_KEY absent — impossible de joindre Clerk'
    );
    return json(
      { error: "Le service d'invitation n'est pas configuré." },
      500
    );
  }

  try {
    // ─── Liste des invitations en attente ──────────────────────────
    if (req.method === 'GET') {
      const { ok, statut, corps } = await appelClerk(
        `${CLERK_API}?status=pending&limit=100`
      );

      if (!ok) {
        console.error('[admin-invitations] liste refusée par Clerk:', statut, corps);
        return json({ error: messageErreurClerk(corps, statut) }, 400);
      }

      // Selon la version de l'API, Clerk renvoie soit un tableau nu, soit
      // `{ data: [...] }`. On normalise pour que l'écran admin n'ait pas à
      // connaître les deux formes.
      const data = Array.isArray(corps)
        ? corps
        : ((corps as { data?: unknown[] } | null)?.data ?? []);

      return json({ invitations: data }, 200);
    }

    // ─── Création d'une invitation ─────────────────────────────────
    if (req.method === 'POST') {
      const payload = await req.json();

      const { ok, statut, corps } = await appelClerk(CLERK_API, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!ok) {
        // On relaie le message de Clerk : « cette adresse est déjà
        // inscrite » indique à l'admin qu'il n'y a rien à réparer, là où un
        // message générique l'aurait fait réessayer indéfiniment.
        console.error('[admin-invitations] création refusée par Clerk:', statut, corps);
        return json({ error: messageErreurClerk(corps, statut) }, 400);
      }

      return json({ invitation: corps }, 200);
    }

    // ─── Révocation d'une invitation ───────────────────────────────
    if (req.method === 'DELETE') {
      const { id } = await req.json();

      if (!id || typeof id !== 'string') {
        return json({ error: "L'identifiant de l'invitation est requis." }, 400);
      }

      // Révoquer est un POST chez Clerk, pas un DELETE : l'invitation n'est
      // pas supprimée, elle change de statut (`revoked`).
      const { ok, statut, corps } = await appelClerk(
        `${CLERK_API}/${encodeURIComponent(id)}/revoke`,
        { method: 'POST' }
      );

      if (!ok) {
        console.error('[admin-invitations] révocation refusée par Clerk:', statut, corps);
        return json({ error: messageErreurClerk(corps, statut) }, 400);
      }

      return json({ invitation: corps }, 200);
    }

    return json({ error: 'Méthode non autorisée.' }, 405);
  } catch (err) {
    console.error('[admin-invitations] erreur handler:', err);
    return json({ error: (err as Error).message }, 500);
  }
});
