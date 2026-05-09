import { create } from 'zustand';
import { fetchAllAvailableHebergements } from '../lib/supabaseHebergements';
import type { Hebergement } from '../types';

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

  loadHebergements: () => Promise<void>;
  setSelectedType: (type: string) => void;
  setSearchLocation: (location: string) => void;
}

export const useHebergementsDiscoveryStore = create<HebergementsDiscoveryState>((set) => ({
  listings: [],
  isLoading: false,
  error: null,
  selectedType: 'All',
  searchLocation: '',

  loadHebergements: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchAllAvailableHebergements();
      const mapped: Hebergement[] = data.map((h, index) => ({
        id: index + 1,
        supabaseId: h.id,
        type: TYPE_LABEL[h.type] || h.type,
        name: h.nom,
        location: h.ville,
        price: `${h.prix_par_nuit} FCFA/nuit`,
        prixParNuit: h.prix_par_nuit,
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
      }));
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
}));
