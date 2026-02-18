import * as Sentry from '@sentry/react-native';
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
}

export async function fetchTrajets(chauffeurId: string): Promise<SupabaseTrajet[]> {
  const { data, error } = await supabase
    .from('trajets')
    .select('*')
    .eq('chauffeur_id', chauffeurId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    Sentry.captureException(new Error(`Error fetching trajets: ${error.message}`));
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
}): Promise<SupabaseTrajet | null> {
  if (!validateCity(trajet.ville_depart) || !validateCity(trajet.ville_arrivee)) {
    console.error('Invalid city name');
    return null;
  }
  if (!validatePrice(trajet.prix)) {
    console.error('Invalid price');
    return null;
  }
  if (!validatePlaces(trajet.places_disponibles)) {
    console.error('Invalid places count');
    return null;
  }

  const sanitizedTrajet = {
    ...trajet,
    ville_depart: sanitizeInput(trajet.ville_depart),
    ville_arrivee: sanitizeInput(trajet.ville_arrivee),
  };

  const { data, error } = await supabase
    .from('trajets')
    .insert(sanitizedTrajet)
    .select()
    .single();

  if (error) {
    Sentry.captureException(new Error(`Error inserting trajet: ${error.message}`));
    return null;
  }
  return data as SupabaseTrajet;
}

export async function deleteTrajet(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('trajets')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    Sentry.captureException(new Error(`Error deleting trajet: ${error.message}`));
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
    Sentry.captureException(new Error(`Error marking trajet effectue: ${error.message}`));
    return false;
  }
  return true;
}
