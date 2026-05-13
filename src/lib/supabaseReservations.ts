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
  started_at?: string | null;
  completed_at?: string | null;
  reviewed?: boolean;
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
    startedAt: row.started_at || undefined,
    completedAt: row.completed_at || undefined,
    reviewed: row.reviewed ?? false,
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
 * Récupère la réservation complète (avec les jointures client/trajet) — utilisé
 * par les écrans qui ont besoin d'afficher le contexte (conversation, banner).
 */
export async function fetchFullReservation(id: string): Promise<Reservation | null> {
  const { data, error } = await supabase
    .from('reservations')
    .select(
      '*, client:client_id(name, avatar), chauffeur:chauffeur_id(name, avatar), trajet:trajet_id(ville_depart, ville_arrivee, date)'
    )
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    if (__DEV__) console.error('fetchFullReservation error:', error?.message);
    return null;
  }
  return mapReservation(data as SupabaseReservation);
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

// ── F3: status flow transitions ────────────────────────────────────────────

/** Generic status transition. Sets started_at/completed_at when relevant. */
export async function updateReservationStatus(
  id: string,
  status: ReservationStatus
): Promise<boolean> {
  const patch: Record<string, unknown> = { status };
  if (status === 'en_route') patch.started_at = new Date().toISOString();
  if (status === 'terminee') patch.completed_at = new Date().toISOString();

  const { error } = await supabase
    .from('reservations')
    .update(patch)
    .eq('id', id);

  if (error) {
    if (__DEV__)
      console.error('Error updating reservation status:', error.message);
    return false;
  }
  return true;
}

/**
 * Client-initiated cancel. Only allowed while still 'en_attente' — once the
 * chauffeur accepts the booking becomes a commitment on both sides and a
 * second flow (chat / pénalité) is needed. The .eq('status', 'en_attente')
 * guard makes the check atomic at the DB layer so a race with an acceptance
 * cannot produce a "cancelled but still accepted" duplicate.
 */
export async function cancelReservationByClient(id: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('reservations')
    .update({ status: 'annulee' })
    .eq('id', id)
    .eq('status', 'en_attente')
    .select('id');

  if (error) {
    if (__DEV__)
      console.error('Error cancelling reservation:', error.message);
    return false;
  }
  // No row returned = the guard rejected it (status had already moved).
  return Array.isArray(data) && data.length > 0;
}

/**
 * Sweep stale en_attente rows older than `ageMs` (default 5 min) into
 * 'expiree'. Called opportunistically from the client UI (loadReservations)
 * — Supabase Edge Functions would be the proper home but we avoid the
 * deploy step by piggy-backing on RLS-authorised user actions instead.
 *
 * Returns the count of rows expired (best-effort, may be undercounted if
 * another caller races).
 */
export async function expireStaleReservations(
  ageMs = 5 * 60 * 1000
): Promise<number> {
  const cutoff = new Date(Date.now() - ageMs).toISOString();
  const { data, error } = await supabase
    .from('reservations')
    .update({ status: 'expiree' })
    .eq('status', 'en_attente')
    .lt('created_at', cutoff)
    .select('id');

  if (error) {
    if (__DEV__) console.error('expireStaleReservations error:', error.message);
    return 0;
  }
  return data?.length ?? 0;
}

/** Marks a reservation reviewed so the auto-prompt doesn't re-fire. */
export async function markReservationReviewed(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('reservations')
    .update({ reviewed: true })
    .eq('id', id);

  if (error) {
    if (__DEV__) console.error('markReservationReviewed error:', error.message);
    return false;
  }
  return true;
}
