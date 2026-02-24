import { create } from 'zustand';
import { HebergeurListing, AccommodationType } from '../types';
import {
  fetchHebergements as fetchSupabaseHebergements,
  insertHebergement,
  deleteHebergement as deleteSupabaseHebergement,
  toggleHebergementStatus as toggleSupabaseStatus,
} from '../lib/supabaseHebergements';

interface HebergementFormData {
  nom: string;
  type: AccommodationType;
  ville: string;
  adresse: string;
  prixParNuit: string;
  capacite: string;
  description: string;
}

const initialFormData: HebergementFormData = {
  nom: '',
  type: 'hotel',
  ville: '',
  adresse: '',
  prixParNuit: '',
  capacite: '1',
  description: '',
};

interface HebergementsState {
  listings: HebergeurListing[];
  formData: HebergementFormData;
  isLoading: boolean;

  // Actions
  addListing: (hebergeurId: string, supabaseProfileId?: string) => Promise<void>;
  removeListing: (id: string) => Promise<void>;
  toggleStatus: (id: string) => Promise<void>;
  updateForm: (field: keyof HebergementFormData, value: string) => void;
  resetForm: () => void;
  loadListings: (supabaseProfileId: string) => Promise<void>;
}

export const useHebergementsStore = create<HebergementsState>((set, get) => ({
  listings: [],
  formData: { ...initialFormData },
  isLoading: false,

  addListing: async (hebergeurId, supabaseProfileId) => {
    const { formData, listings } = get();

    const localListing: HebergeurListing = {
      id: Date.now().toString(),
      hebergeurId,
      nom: formData.nom,
      type: formData.type,
      ville: formData.ville,
      adresse: formData.adresse,
      prixParNuit: parseInt(formData.prixParNuit) || 0,
      capacite: parseInt(formData.capacite) || 1,
      description: formData.description,
      status: 'actif',
      createdAt: new Date().toISOString(),
    };
    set({ listings: [localListing, ...listings], formData: { ...initialFormData } });

    // Persister en Supabase
    if (supabaseProfileId) {
      const result = await insertHebergement({
        hebergeur_id: supabaseProfileId,
        nom: formData.nom,
        type: formData.type,
        ville: formData.ville,
        adresse: formData.adresse,
        prix_par_nuit: parseInt(formData.prixParNuit) || 0,
        capacite: parseInt(formData.capacite) || 1,
        description: formData.description,
      });

      if (result) {
        set((state) => ({
          listings: state.listings.map((l) =>
            l.id === localListing.id ? { ...l, id: result.id } : l
          ),
        }));
      }
    }
  },

  removeListing: async (id) => {
    set({ listings: get().listings.filter((l) => l.id !== id) });
    await deleteSupabaseHebergement(id);
  },

  toggleStatus: async (id) => {
    const listing = get().listings.find((l) => l.id === id);
    if (!listing) return;
    const newStatus = listing.status === 'actif' ? 'inactif' : 'actif';
    set({
      listings: get().listings.map((l) =>
        l.id === id ? { ...l, status: newStatus as 'actif' | 'inactif' } : l
      ),
    });
    await toggleSupabaseStatus(id, newStatus);
  },

  updateForm: (field, value) => {
    set({ formData: { ...get().formData, [field]: value } });
  },

  resetForm: () => {
    set({ formData: { ...initialFormData } });
  },

  loadListings: async (supabaseProfileId) => {
    set({ isLoading: true });
    try {
      const data = await fetchSupabaseHebergements(supabaseProfileId);
      const listings: HebergeurListing[] = data.map((h) => ({
        id: h.id,
        hebergeurId: h.hebergeur_id,
        nom: h.nom,
        type: h.type as AccommodationType,
        ville: h.ville,
        adresse: h.adresse,
        prixParNuit: h.prix_par_nuit,
        capacite: h.capacite,
        description: h.description,
        status: h.status as 'actif' | 'inactif',
        createdAt: h.created_at,
      }));
      set({ listings });
    } catch (err) {
      console.error('Error loading hebergements:', err);
    } finally {
      set({ isLoading: false });
    }
  },
}));
