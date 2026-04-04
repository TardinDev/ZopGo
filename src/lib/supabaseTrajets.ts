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
}): Promise<SupabaseTrajet | null> {
  if (!validateCity(trajet.ville_depart) || !validateCity(trajet.ville_arrivee)) {
    if (__DEV__) console.error('Invalid city name');
    return null;
  }
  if (!validatePrice(trajet.prix)) {
    if (__DEV__) console.error('Invalid price');
    return null;
  }
  if (!validatePlaces(trajet.places_disponibles)) {
    if (__DEV__) console.error('Invalid places count');
    return null;
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
    if (__DEV__) console.error('Error inserting trajet:', error.message);
    return null;
  }
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
