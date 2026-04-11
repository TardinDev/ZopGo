import { supabase } from './supabase';
import type { Reservation, ReservationStatus } from '../types';

export interface SupabaseReservation {
  id: string;
  trajet_id: string;
  client_id: string;
  chauffeur_id: string;
  nombre_places: number;
  prix_total: number;
  status: ReservationStatus;
  created_at: string;
  updated_at: string;
  client?: { name: string; avatar: string } | null;
  chauffeur?: { name: string; avatar: string } | null;
  trajet?: {
    ville_depart: string;
    ville_arrivee: string;
    date: string | null;
  } | null;
}

function mapReservation(row: SupabaseReservation): Reservation {
  return {
    id: row.id,
    trajetId: row.trajet_id,
    clientId: row.client_id,
    chauffeurId: row.chauffeur_id,
    nombrePlaces: row.nombre_places,
    prixTotal: row.prix_total,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    clientName: row.client?.name,
    clientAvatar: row.client?.avatar,
    chauffeurName: row.chauffeur?.name,
    chauffeurAvatar: row.chauffeur?.avatar,
    villeDepart: row.trajet?.ville_depart,
    villeArrivee: row.trajet?.ville_arrivee,
    date: row.trajet?.date || undefined,
  };
}

export async function insertReservation(params: {
  trajet_id: string;
  client_id: string;
  chauffeur_id: string;
  nombre_places: number;
  prix_total: number;
}): Promise<Reservation | null> {
  const { data, error } = await supabase
    .from('reservations')
    .insert({
      ...params,
      status: 'en_attente',
    })
    .select()
    .single();

  if (error) {
    if (__DEV__) console.error('Error inserting reservation:', error.message);
    return null;
  }
  return mapReservation(data as SupabaseReservation);
}

export async function fetchReservationsForChauffeur(chauffeurId: string): Promise<Reservation[]> {
  const { data, error } = await supabase
    .from('reservations')
    .select('*, client:client_id(name, avatar), trajet:trajet_id(ville_depart, ville_arrivee, date)')
    .eq('chauffeur_id', chauffeurId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    if (__DEV__) console.error('Error fetching chauffeur reservations:', error.message);
    return [];
  }
  return ((data as SupabaseReservation[]) || []).map(mapReservation);
}

export async function fetchReservationsByTrajetId(
  trajetId: string,
  statuses?: ReservationStatus[]
): Promise<Reservation[]> {
  let query = supabase
    .from('reservations')
    .select('*, client:client_id(name, avatar)')
    .eq('trajet_id', trajetId);

  if (statuses && statuses.length > 0) {
    query = query.in('status', statuses);
  }

  const { data, error } = await query;

  if (error) {
    if (__DEV__)
      console.error('Error fetching reservations by trajet:', error.message);
    return [];
  }
  return ((data as SupabaseReservation[]) || []).map(mapReservation);
}

export async function fetchReservationsForClient(clientId: string): Promise<Reservation[]> {
  const { data, error } = await supabase
    .from('reservations')
    .select('*, chauffeur:chauffeur_id(name, avatar), trajet:trajet_id(ville_depart, ville_arrivee, date)')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    if (__DEV__) console.error('Error fetching client reservations:', error.message);
    return [];
  }
  return ((data as SupabaseReservation[]) || []).map(mapReservation);
}

export async function fetchReservationContexts(
  reservationIds: string[]
): Promise<Record<string, { villeDepart: string; villeArrivee: string }>> {
  if (reservationIds.length === 0) return {};

  const { data, error } = await supabase
    .from('reservations')
    .select('id, trajet:trajet_id(ville_depart, ville_arrivee)')
    .in('id', reservationIds);

  if (error) {
    if (__DEV__) console.error('fetchReservationContexts error:', error.message);
    return {};
  }

  const result: Record<string, { villeDepart: string; villeArrivee: string }> = {};
  for (const row of data || []) {
    const trajet = row.trajet as unknown as { ville_depart: string; ville_arrivee: string } | null;
    if (trajet?.ville_depart && trajet?.ville_arrivee) {
      result[row.id] = {
        villeDepart: trajet.ville_depart,
        villeArrivee: trajet.ville_arrivee,
      };
    }
  }
  return result;
}

/**
 * Récupère les infos minimales d'une réservation (trajet_id et nombre_places)
 * pour permettre aux flux d'acceptation de décrémenter le bon nombre de places
 * sans dépendre d'un état local potentiellement périmé.
 */
export async function fetchReservationById(
  id: string
): Promise<{ trajetId: string; nombrePlaces: number } | null> {
  const { data, error } = await supabase
    .from('reservations')
    .select('trajet_id, nombre_places')
    .eq('id', id)
    .single();

  if (error || !data) {
    if (__DEV__) console.error('Error fetching reservation:', error?.message);
    return null;
  }

  return {
    trajetId: (data as { trajet_id: string }).trajet_id,
    nombrePlaces: (data as { nombre_places: number }).nombre_places,
  };
}

export async function acceptReservation(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('reservations')
    .update({ status: 'acceptee' })
    .eq('id', id);

  if (error) {
    if (__DEV__) console.error('Error accepting reservation:', error.message);
    return false;
  }
  return true;
}

export async function refuseReservation(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('reservations')
    .update({ status: 'refusee' })
    .eq('id', id);

  if (error) {
    if (__DEV__) console.error('Error refusing reservation:', error.message);
    return false;
  }
  return true;
}
