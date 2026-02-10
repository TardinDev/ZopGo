import { supabase } from './supabase';

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
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching trajets:', error.message);
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
  const { data, error } = await supabase
    .from('trajets')
    .insert(trajet)
    .select()
    .single();

  if (error) {
    console.error('Error inserting trajet:', error.message);
    return null;
  }
  return data as SupabaseTrajet;
}

export async function deleteTrajet(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('trajets')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting trajet:', error.message);
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
    console.error('Error marking trajet effectue:', error.message);
    return false;
  }
  return true;
}
