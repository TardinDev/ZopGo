import { supabase } from './supabase';
import type { HebergementReservation, ReservationStatus } from '../types';

interface SupabaseHebergementReservation {
  id: string;
  hebergement_id: string;
  client_id: string;
  hebergeur_id: string;
  nombre_nuits: number;
  prix_total: number;
  status: ReservationStatus;
  created_at: string;
  updated_at: string;
  client?: { name: string; avatar: string } | null;
  hebergeur?: { name: string; avatar: string } | null;
  hebergement?: { nom: string; ville: string } | null;
}

function mapReservation(row: SupabaseHebergementReservation): HebergementReservation {
  return {
    id: row.id,
    hebergementId: row.hebergement_id,
    clientId: row.client_id,
    hebergeurId: row.hebergeur_id,
    nombreNuits: row.nombre_nuits,
    prixTotal: row.prix_total,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    clientName: row.client?.name,
    clientAvatar: row.client?.avatar,
    hebergeurName: row.hebergeur?.name,
    hebergeurAvatar: row.hebergeur?.avatar,
    hebergementNom: row.hebergement?.nom,
    hebergementVille: row.hebergement?.ville,
  };
}

export async function insertHebergementReservation(params: {
  hebergement_id: string;
  client_id: string;
  hebergeur_id: string;
  nombre_nuits: number;
  prix_total: number;
}): Promise<HebergementReservation | null> {
  const { data, error } = await supabase
    .from('hebergement_reservations')
    .insert({
      ...params,
      status: 'en_attente',
    })
    .select()
    .single();

  if (error) {
    if (__DEV__) console.error('Error inserting hebergement reservation:', error.message);
    return null;
  }
  return mapReservation(data as SupabaseHebergementReservation);
}

export async function acceptHebergementReservation(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('hebergement_reservations')
    .update({ status: 'acceptee' })
    .eq('id', id);

  if (error) {
    if (__DEV__) console.error('Error accepting hebergement reservation:', error.message);
    return false;
  }
  return true;
}

export async function refuseHebergementReservation(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('hebergement_reservations')
    .update({ status: 'refusee' })
    .eq('id', id);

  if (error) {
    if (__DEV__) console.error('Error refusing hebergement reservation:', error.message);
    return false;
  }
  return true;
}

export async function fetchHebergementReservationsForClient(
  clientId: string
): Promise<HebergementReservation[]> {
  const { data, error } = await supabase
    .from('hebergement_reservations')
    .select('*, hebergeur:hebergeur_id(name, avatar), hebergement:hebergement_id(nom, ville)')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    if (__DEV__) console.error('Error fetching client hebergement reservations:', error.message);
    return [];
  }
  return ((data as SupabaseHebergementReservation[]) || []).map(mapReservation);
}

export async function fetchHebergementReservationsForHebergeur(
  hebergeurId: string
): Promise<HebergementReservation[]> {
  const { data, error } = await supabase
    .from('hebergement_reservations')
    .select('*, client:client_id(name, avatar), hebergement:hebergement_id(nom, ville)')
    .eq('hebergeur_id', hebergeurId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    if (__DEV__) console.error('Error fetching hebergeur reservations:', error.message);
    return [];
  }
  return ((data as SupabaseHebergementReservation[]) || []).map(mapReservation);
}

export async function fetchHebergementReservationContexts(
  reservationIds: string[]
): Promise<Record<string, { hebergementNom: string; hebergementVille: string }>> {
  if (reservationIds.length === 0) return {};

  const { data, error } = await supabase
    .from('hebergement_reservations')
    .select('id, hebergement:hebergement_id(nom, ville)')
    .in('id', reservationIds);

  if (error) {
    if (__DEV__) console.error('fetchHebergementReservationContexts error:', error.message);
    return {};
  }

  const result: Record<string, { hebergementNom: string; hebergementVille: string }> = {};
  for (const row of data || []) {
    const heb = row.hebergement as unknown as { nom: string; ville: string } | null;
    if (heb?.nom && heb?.ville) {
      result[row.id] = {
        hebergementNom: heb.nom,
        hebergementVille: heb.ville,
      };
    }
  }
  return result;
}
