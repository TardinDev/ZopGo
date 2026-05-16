import { supabase } from './supabase';
import { sanitizeInput, validateLocation } from '../utils/validation';
import type { Livraison, LivraisonStatus } from '../types';

interface SupabaseLivraisonRow {
  id: string;
  client_id: string;
  livreur_id: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  description: string | null;
  prix_estime: number | null;
  status: LivraisonStatus;
  accepted_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  client?: { name: string; avatar: string } | null;
  livreur?: { name: string; avatar: string } | null;
}

function mapRow(row: SupabaseLivraisonRow): Livraison {
  return {
    id: row.id,
    clientId: row.client_id,
    livreurId: row.livreur_id,
    pickupLocation: row.pickup_location,
    dropoffLocation: row.dropoff_location,
    pickupLat: row.pickup_lat,
    pickupLng: row.pickup_lng,
    dropoffLat: row.dropoff_lat,
    dropoffLng: row.dropoff_lng,
    description: row.description,
    prixEstime: row.prix_estime ?? 0,
    status: row.status,
    acceptedAt: row.accepted_at,
    pickedUpAt: row.picked_up_at,
    deliveredAt: row.delivered_at,
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    clientName: row.client?.name,
    clientAvatar: row.client?.avatar,
    livreurName: row.livreur?.name,
    livreurAvatar: row.livreur?.avatar,
  };
}

export async function insertLivraison(params: {
  client_id: string;
  livreur_id: string;
  pickup_location: string;
  dropoff_location: string;
  description?: string;
  prix_estime?: number;
}): Promise<Livraison | null> {
  if (params.description && params.description.length > 500) {
    console.warn('[insertLivraison] FAILED: description too long');
    return null;
  }

  // Sanitize FIRST then validate — otherwise a string like "<><><" passes
  // validateLocation (5 chars, within bounds) and turns into "" after the
  // HTML-stripping pass, silently writing empty locations to the DB.
  const sanitized = {
    ...params,
    pickup_location: sanitizeInput(params.pickup_location),
    dropoff_location: sanitizeInput(params.dropoff_location),
    description: params.description ? sanitizeInput(params.description) : undefined,
  };

  if (!validateLocation(sanitized.pickup_location) || !validateLocation(sanitized.dropoff_location)) {
    console.warn('[insertLivraison] FAILED: invalid pickup/dropoff location (post-sanitize)');
    return null;
  }

  const { data, error } = await supabase
    .from('livraisons')
    .insert({
      ...sanitized,
      status: 'en_attente',
    })
    .select('*, client:client_id(name, avatar), livreur:livreur_id(name, avatar)')
    .single();

  if (error) {
    console.warn('[insertLivraison] FAILED', { code: error.code, message: error.message });
    return null;
  }
  console.log('[insertLivraison] OK', (data as SupabaseLivraisonRow).id);
  return mapRow(data as SupabaseLivraisonRow);
}

export async function fetchLivraisonsForClient(
  clientId: string
): Promise<Livraison[]> {
  const { data, error } = await supabase
    .from('livraisons')
    .select('*, livreur:livreur_id(name, avatar)')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    if (__DEV__) console.error('fetchLivraisonsForClient error:', error.message);
    return [];
  }
  return ((data as SupabaseLivraisonRow[]) || []).map(mapRow);
}

export async function fetchLivraisonsForLivreur(
  livreurId: string
): Promise<Livraison[]> {
  const { data, error } = await supabase
    .from('livraisons')
    .select('*, client:client_id(name, avatar)')
    .eq('livreur_id', livreurId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    if (__DEV__) console.error('fetchLivraisonsForLivreur error:', error.message);
    return [];
  }
  return ((data as SupabaseLivraisonRow[]) || []).map(mapRow);
}

export async function fetchLivraisonById(id: string): Promise<Livraison | null> {
  const { data, error } = await supabase
    .from('livraisons')
    .select('*, client:client_id(name, avatar), livreur:livreur_id(name, avatar)')
    .eq('id', id)
    .single();

  if (error || !data) {
    if (__DEV__ && error) console.error('fetchLivraisonById error:', error.message);
    return null;
  }
  return mapRow(data as SupabaseLivraisonRow);
}

// Each forward transition is only allowed from a specific predecessor (the UI
// gates the buttons but the DB-level guard prevents stale taps or concurrent
// flows from producing an inconsistent row — same pattern as reservations).
// `cancel` has multiple valid predecessors; we expose `allowedFrom` so the
// caller declares the set explicitly.
async function updateStatus(
  id: string,
  status: LivraisonStatus,
  options: {
    extra?: Record<string, string>;
    allowedFrom?: LivraisonStatus | LivraisonStatus[];
  } = {}
): Promise<boolean> {
  const { extra = {}, allowedFrom } = options;
  let query = supabase
    .from('livraisons')
    .update({ status, ...extra })
    .eq('id', id);

  if (allowedFrom !== undefined) {
    query = Array.isArray(allowedFrom)
      ? query.in('status', allowedFrom)
      : query.eq('status', allowedFrom);
  }

  const { data, error } = await query.select('id');

  if (error) {
    if (__DEV__)
      console.error(`updateStatus(${status}) error:`, error.message);
    return false;
  }
  return Array.isArray(data) && data.length > 0;
}

export function acceptLivraison(id: string): Promise<boolean> {
  return updateStatus(id, 'acceptee', {
    extra: { accepted_at: new Date().toISOString() },
    allowedFrom: 'en_attente',
  });
}

export function refuseLivraison(id: string): Promise<boolean> {
  return updateStatus(id, 'refusee', { allowedFrom: 'en_attente' });
}

export function markLivraisonEnCours(id: string): Promise<boolean> {
  return updateStatus(id, 'en_cours', {
    extra: { picked_up_at: new Date().toISOString() },
    allowedFrom: 'acceptee',
  });
}

export function markLivraisonLivree(id: string): Promise<boolean> {
  return updateStatus(id, 'livree', {
    extra: { delivered_at: new Date().toISOString() },
    allowedFrom: 'en_cours',
  });
}

export function cancelLivraison(id: string): Promise<boolean> {
  return updateStatus(id, 'annulee', {
    extra: { cancelled_at: new Date().toISOString() },
    // Cancel valid before delivery — once livrée/refusée/déjà annulée,
    // we don't re-cancel.
    allowedFrom: ['en_attente', 'acceptee', 'en_cours'],
  });
}
