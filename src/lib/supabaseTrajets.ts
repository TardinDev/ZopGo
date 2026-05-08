import { supabase } from './supabase';
import { sanitizeInput, validateCity, validatePrice, validatePlaces } from '../utils/validation';

export interface SupabaseTrajet {
  id: string;
  chauffeur_id: string;
  ville_depart: string;
  ville_arrivee: string;
  prix: number;
  vehicule: string;
  date: string | null;
  places_disponibles: number;
  status: string;
  created_at: string;
  marque: string | null;
  modele: string | null;
  couleur: string | null;
  profiles?: { name: string; avatar: string; rating: number } | null;
}

export async function fetchTrajets(chauffeurId: string): Promise<SupabaseTrajet[]> {
  const { data, error } = await supabase
    .from('trajets')
    .select('*')
    .eq('chauffeur_id', chauffeurId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    if (__DEV__) console.error('Error fetching trajets:', error.message);
    return [];
  }
  return (data as SupabaseTrajet[]) || [];
}

export async function insertTrajet(trajet: {
  chauffeur_id: string;
  ville_depart: string;
  ville_arrivee: string;
  prix: number;
  vehicule: string;
  date?: string;
  places_disponibles: number;
  marque?: string;
  modele?: string;
  couleur?: string;
}): Promise<SupabaseTrajet> {
  if (!validateCity(trajet.ville_depart) || !validateCity(trajet.ville_arrivee)) {
    console.warn('[insertTrajet] FAILED: invalid city name');
    throw new Error('Ville de départ ou d\'arrivée invalide.');
  }
  if (!validatePrice(trajet.prix)) {
    console.warn('[insertTrajet] FAILED: invalid price', trajet.prix);
    throw new Error('Prix invalide.');
  }
  if (!validatePlaces(trajet.places_disponibles)) {
    console.warn('[insertTrajet] FAILED: invalid places', trajet.places_disponibles);
    throw new Error('Nombre de places invalide.');
  }

  const sanitizedTrajet = {
    ...trajet,
    ville_depart: sanitizeInput(trajet.ville_depart),
    ville_arrivee: sanitizeInput(trajet.ville_arrivee),
    marque: trajet.marque ? sanitizeInput(trajet.marque) : undefined,
    modele: trajet.modele ? sanitizeInput(trajet.modele) : undefined,
    couleur: trajet.couleur ? sanitizeInput(trajet.couleur) : undefined,
  };

  const { data, error } = await supabase
    .from('trajets')
    .insert(sanitizedTrajet)
    .select()
    .single();

  if (error) {
    console.warn('[insertTrajet] FAILED', { code: error.code, message: error.message, details: error.details });
    throw new Error(error.message);
  }
  console.log('[insertTrajet] OK', (data as SupabaseTrajet).id);
  return data as SupabaseTrajet;
}

export async function fetchAllAvailableTrajets(): Promise<SupabaseTrajet[]> {
  const { data, error } = await supabase
    .from('trajets')
    .select('*, profiles:chauffeur_id(name, avatar, rating)')
    .eq('status', 'en_attente')
    .gt('places_disponibles', 0)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    if (__DEV__) console.error('Error fetching all available trajets:', error.message);
    return [];
  }
  return (data as SupabaseTrajet[]) || [];
}

export async function updateTrajetPlaces(trajetId: string, newPlaces: number): Promise<boolean> {
  const updates: { places_disponibles: number; status?: string } = {
    places_disponibles: Math.max(0, newPlaces),
  };
  if (newPlaces <= 0) {
    updates.status = 'complet';
  } else {
    updates.status = 'en_attente';
  }

  const { error } = await supabase
    .from('trajets')
    .update(updates)
    .eq('id', trajetId);

  if (error) {
    if (__DEV__) console.error('Error updating trajet places:', error.message);
    return false;
  }
  return true;
}

/**
 * Décrémente atomiquement les places disponibles d'un trajet.
 * Lit la valeur courante depuis la BD puis applique updateTrajetPlaces,
 * pour éviter de se baser sur un cache local potentiellement périmé
 * (plusieurs réservations concurrentes).
 */
export async function decrementTrajetPlaces(trajetId: string, by: number): Promise<boolean> {
  const { data, error } = await supabase
    .from('trajets')
    .select('places_disponibles')
    .eq('id', trajetId)
    .single();

  if (error || !data) {
    if (__DEV__) console.error('Error fetching trajet for decrement:', error?.message);
    return false;
  }

  const current = (data as { places_disponibles: number }).places_disponibles ?? 0;
  return updateTrajetPlaces(trajetId, Math.max(0, current - by));
}

export async function deleteTrajet(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('trajets')
    .delete()
    .eq('id', id);

  if (error) {
    if (__DEV__) console.error('Error deleting trajet:', error.message);
    return false;
  }
  return true;
}

export async function markTrajetEffectue(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('trajets')
    .update({ status: 'effectue' })
    .eq('id', id);

  if (error) {
    if (__DEV__) console.error('Error marking trajet effectue:', error.message);
    return false;
  }
  return true;
}
