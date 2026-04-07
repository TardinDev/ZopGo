import { supabase } from './supabase';
import { sanitizeInput } from '../utils/validation';

export interface SupabaseHebergement {
  id: string;
  hebergeur_id: string;
  nom: string;
  type: string;
  ville: string;
  adresse: string;
  prix_par_nuit: number;
  capacite: number;
  description: string;
  status: string;
  disponibilite: number;
  images: string[];
  created_at: string;
  profiles?: { name: string; avatar: string; rating: number } | null;
}

export async function fetchHebergements(hebergeurId: string): Promise<SupabaseHebergement[]> {
  const { data, error } = await supabase
    .from('hebergements')
    .select('*')
    .eq('hebergeur_id', hebergeurId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    if (__DEV__) console.error('Error fetching hebergements:', error.message);
    return [];
  }
  return (data as SupabaseHebergement[]) || [];
}

export async function insertHebergement(hebergement: {
  hebergeur_id: string;
  nom: string;
  type: string;
  ville: string;
  adresse: string;
  prix_par_nuit: number;
  capacite: number;
  description: string;
  disponibilite?: number;
  status?: string;
  images?: string[];
}): Promise<SupabaseHebergement | null> {
  const sanitized = {
    ...hebergement,
    nom: sanitizeInput(hebergement.nom),
    ville: sanitizeInput(hebergement.ville),
    adresse: sanitizeInput(hebergement.adresse),
    description: sanitizeInput(hebergement.description),
  };

  const { data, error } = await supabase
    .from('hebergements')
    .insert(sanitized)
    .select()
    .single();

  if (error) {
    if (__DEV__) console.error('Error inserting hebergement:', error.message);
    return null;
  }
  return data as SupabaseHebergement;
}

export async function fetchAllAvailableHebergements(): Promise<SupabaseHebergement[]> {
  const { data, error } = await supabase
    .from('hebergements')
    .select('*, profiles:hebergeur_id(name, avatar, rating)')
    .eq('status', 'actif')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    if (__DEV__) console.error('Error fetching all available hebergements:', error.message);
    return [];
  }
  return (data as SupabaseHebergement[]) || [];
}

export async function deleteHebergement(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('hebergements')
    .delete()
    .eq('id', id);

  if (error) {
    if (__DEV__) console.error('Error deleting hebergement:', error.message);
    return false;
  }
  return true;
}

export async function updateHebergementDisponibilite(
  id: string,
  newDisponibilite: number
): Promise<boolean> {
  const { error } = await supabase
    .from('hebergements')
    .update({ disponibilite: newDisponibilite })
    .eq('id', id);

  if (error) {
    if (__DEV__) console.error('Error updating hebergement disponibilite:', error.message);
    return false;
  }
  return true;
}

export async function toggleHebergementStatus(id: string, newStatus: string): Promise<boolean> {
  const { error } = await supabase
    .from('hebergements')
    .update({ status: newStatus })
    .eq('id', id);

  if (error) {
    if (__DEV__) console.error('Error toggling hebergement status:', error.message);
    return false;
  }
  return true;
}
