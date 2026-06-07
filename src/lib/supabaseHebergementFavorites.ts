import { supabase } from './supabase';
import type { Hebergement } from '../types';
import { isTarifPeriode, periodeSuffixe } from '../utils/tarifPeriode';

const TYPE_LABEL: Record<string, string> = {
  hotel: 'Hôtel',
  auberge: 'Auberge',
  appartement: 'Appart.',
  maison: 'Maison',
  chambre: 'Chambre',
};
const TYPE_ICON: Record<string, string> = {
  hotel: '🏨',
  auberge: '🛖',
  appartement: '🏢',
  maison: '🏡',
  chambre: '🛏️',
};

/** The hebergement_id list a client has favourited. */
export async function fetchFavoriteIds(clientId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('hebergement_favorites')
    .select('hebergement_id')
    .eq('client_id', clientId);

  if (error) {
    if (__DEV__) console.error('fetchFavoriteIds error:', error.message);
    return [];
  }
  return ((data as { hebergement_id: string }[]) || []).map((r) => r.hebergement_id);
}

export async function addFavorite(clientId: string, hebergementId: string): Promise<boolean> {
  const { error } = await supabase
    .from('hebergement_favorites')
    .insert({ client_id: clientId, hebergement_id: hebergementId });
  if (error) {
    if (__DEV__) console.error('addFavorite error:', error.message);
    return false;
  }
  return true;
}

export async function removeFavorite(clientId: string, hebergementId: string): Promise<boolean> {
  const { error } = await supabase
    .from('hebergement_favorites')
    .delete()
    .eq('client_id', clientId)
    .eq('hebergement_id', hebergementId);
  if (error) {
    if (__DEV__) console.error('removeFavorite error:', error.message);
    return false;
  }
  return true;
}

interface FavoriteJoinRow {
  hebergement_id: string;
  hebergement: {
    id: string;
    nom: string;
    type: string;
    ville: string;
    adresse: string;
    prix_par_nuit: number;
    periode_tarif?: string;
    capacite: number;
    disponibilite: number;
    description: string;
    images: string[] | null;
    amenities: string[] | null;
    hebergeur_id: string;
    status: string;
    profiles?: { name: string; avatar: string; rating: number } | null;
  } | null;
}

/**
 * Full favourited listings for the "Mes favoris" screen, mapped to the same
 * Hebergement shape the discovery card consumes. Listings that were deleted
 * or turned inactive are filtered out.
 */
export async function fetchFavoriteHebergements(clientId: string): Promise<Hebergement[]> {
  const { data, error } = await supabase
    .from('hebergement_favorites')
    .select(
      'hebergement_id, hebergement:hebergement_id(id, nom, type, ville, adresse, prix_par_nuit, periode_tarif, capacite, disponibilite, description, images, amenities, hebergeur_id, status, profiles:hebergeur_id(name, avatar, rating))'
    )
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    if (__DEV__) console.error('fetchFavoriteHebergements error:', error.message);
    return [];
  }

  const rows = (data as unknown as FavoriteJoinRow[]) || [];
  return rows
    .map((row, index): Hebergement | null => {
      const h = row.hebergement;
      if (!h || h.status !== 'actif') return null;
      const periodeTarif = isTarifPeriode(h.periode_tarif) ? h.periode_tarif : 'nuit';
      return {
        id: index + 1,
        supabaseId: h.id,
        type: TYPE_LABEL[h.type] || h.type,
        name: h.nom,
        location: h.ville,
        price: `${h.prix_par_nuit} FCFA/${periodeSuffixe(periodeTarif)}`,
        prixParNuit: h.prix_par_nuit,
        periodeTarif,
        rating: h.profiles?.rating ?? 0,
        icon: TYPE_ICON[h.type] || '🏨',
        images: h.images || [],
        hebergeurName: h.profiles?.name,
        hebergeurAvatar: h.profiles?.avatar,
        hebergeurRating: h.profiles?.rating,
        hebergeurProfileId: h.hebergeur_id,
        capacite: h.capacite,
        disponibilite: h.disponibilite,
        description: h.description,
        adresse: h.adresse,
        amenities: h.amenities || [],
      };
    })
    .filter((h): h is Hebergement => h !== null);
}
