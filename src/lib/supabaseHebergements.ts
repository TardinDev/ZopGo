import * as Sentry from '@sentry/react-native';
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
  created_at: string;
}

export async function fetchHebergements(hebergeurId: string): Promise<SupabaseHebergement[]> {
  const { data, error } = await supabase
    .from('hebergements')
    .select('*')
    .eq('hebergeur_id', hebergeurId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    Sentry.captureException(new Error(`Error fetching hebergements: ${error.message}`));
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
    Sentry.captureException(new Error(`Error inserting hebergement: ${error.message}`));
    return null;
  }
  return data as SupabaseHebergement;
}

export async function fetchAllAvailableHebergements(): Promise<SupabaseHebergement[]> {
  const { data, error } = await supabase
    .from('hebergements')
    .select('*')
    .is('deleted_at', null)
    .eq('status', 'actif')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    Sentry.captureException(new Error(`Error fetching all available hebergements: ${error.message}`));
    return [];
  }
  return (data as SupabaseHebergement[]) || [];
}

export async function deleteHebergement(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('hebergements')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    Sentry.captureException(new Error(`Error deleting hebergement: ${error.message}`));
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
    Sentry.captureException(new Error(`Error toggling hebergement status: ${error.message}`));
    return false;
  }
  return true;
}
