import { supabase } from './supabase';
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
  const { data, error } = await supabase
    .from('livraisons')
    .insert({
      ...params,
      status: 'en_attente',
    })
    .select('*, client:client_id(name, avatar), livreur:livreur_id(name, avatar)')
    .single();

  if (error) {
    if (__DEV__) console.error('insertLivraison error:', error.message);
    return null;
  }
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

async function updateStatus(
  id: string,
  status: LivraisonStatus,
  extra: Record<string, string> = {}
): Promise<boolean> {
  const { error } = await supabase
    .from('livraisons')
    .update({ status, ...extra })
    .eq('id', id);

  if (error) {
    if (__DEV__)
      console.error(`updateStatus(${status}) error:`, error.message);
    return false;
  }
  return true;
}

export function acceptLivraison(id: string): Promise<boolean> {
  return updateStatus(id, 'acceptee', { accepted_at: new Date().toISOString() });
}

export function refuseLivraison(id: string): Promise<boolean> {
  return updateStatus(id, 'refusee');
}

export function markLivraisonEnCours(id: string): Promise<boolean> {
  return updateStatus(id, 'en_cours', { picked_up_at: new Date().toISOString() });
}

export function markLivraisonLivree(id: string): Promise<boolean> {
  return updateStatus(id, 'livree', { delivered_at: new Date().toISOString() });
}

export function cancelLivraison(id: string): Promise<boolean> {
  return updateStatus(id, 'annulee', { cancelled_at: new Date().toISOString() });
}
