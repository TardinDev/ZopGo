import { create } from 'zustand';
import { fetchAllAvailableHebergements } from '../lib/supabaseHebergements';
import type { Hebergement } from '../types';
import type { HebergementSort } from '../lib/hebergementsFilters';
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
  auberge: '🏠',
  appartement: '🏢',
  maison: '🏡',
  chambre: '🛏️',
};

export const hebergementTypes = ['All', 'Hôtel', 'Auberge', 'Appart.', 'Maison', 'Chambre'];

interface HebergementsDiscoveryState {
  listings: Hebergement[];
  isLoading: boolean;
  error: string | null;
  selectedType: string;
  searchLocation: string;
  priceMax: number | null;
  minCapacity: number | null;
  sortBy: HebergementSort;

  loadHebergements: () => Promise<void>;
  setSelectedType: (type: string) => void;
  setSearchLocation: (location: string) => void;
  setPriceMax: (price: number | null) => void;
  setMinCapacity: (capacity: number | null) => void;
  setSortBy: (s: HebergementSort) => void;
  resetFilters: () => void;
}

export const useHebergementsDiscoveryStore = create<HebergementsDiscoveryState>((set) => ({
  listings: [],
  isLoading: false,
  error: null,
  selectedType: 'All',
  searchLocation: '',
  priceMax: null,
  minCapacity: null,
  sortBy: 'default',

  loadHebergements: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchAllAvailableHebergements();
      const mapped: Hebergement[] = data.map((h, index) => {
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
      });
      set({ listings: mapped, error: null });
    } catch (err) {
      console.warn('[loadHebergements] FAILED', err instanceof Error ? err.message : err);
      // Distinguish a failed fetch from an empty result so the UI shows a
      // retry banner rather than the cheerful "Le Gabon prépare ses chambres"
      // empty state.
      set({ error: 'Impossible de charger les hébergements. Vérifie ta connexion.' });
    } finally {
      set({ isLoading: false });
    }
  },
  setSelectedType: (type) => set({ selectedType: type }),
  setSearchLocation: (location) => set({ searchLocation: location }),
  setPriceMax: (priceMax) => set({ priceMax }),
  setMinCapacity: (minCapacity) => set({ minCapacity }),
  setSortBy: (sortBy) => set({ sortBy }),
  resetFilters: () =>
    set({
      selectedType: 'All',
      searchLocation: '',
      priceMax: null,
      minCapacity: null,
      sortBy: 'default',
    }),
}));
