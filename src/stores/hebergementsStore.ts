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
  disponible: boolean;
  disponibilite: string;
  images: string[];
}

const initialFormData: HebergementFormData = {
  nom: '',
  type: 'hotel',
  ville: '',
  adresse: '',
  prixParNuit: '',
  capacite: '1',
  description: '',
  disponible: true,
  disponibilite: '1',
  images: [],
};

interface HebergementsState {
  listings: HebergeurListing[];
  formData: HebergementFormData;
  isLoading: boolean;

  addListing: (hebergeurId: string, supabaseProfileId?: string, imageUrls?: string[]) => Promise<void>;
  removeListing: (id: string) => Promise<void>;
  toggleStatus: (id: string) => Promise<void>;
  updateForm: (field: keyof HebergementFormData, value: string | boolean) => void;
  addFormImage: (uri: string) => void;
  removeFormImage: (index: number) => void;
  resetForm: () => void;
  loadListings: (supabaseProfileId: string) => Promise<void>;
}

export const useHebergementsStore = create<HebergementsState>((set, get) => ({
  listings: [],
  formData: { ...initialFormData },
  isLoading: false,

  addListing: async (hebergeurId, supabaseProfileId, imageUrls) => {
    const { formData, listings } = get();

    const status = formData.disponible ? 'actif' : 'inactif';
    const disponibilite = parseInt(formData.disponibilite) || 1;
    const images = imageUrls || [];

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
      status,
      disponibilite,
      images,
      createdAt: new Date().toISOString(),
    };
    set({ listings: [localListing, ...listings], formData: { ...initialFormData } });

    if (supabaseProfileId) {
      try {
        const result = await insertHebergement({
          hebergeur_id: supabaseProfileId,
          nom: formData.nom,
          type: formData.type,
          ville: formData.ville,
          adresse: formData.adresse,
          prix_par_nuit: parseInt(formData.prixParNuit) || 0,
          capacite: parseInt(formData.capacite) || 1,
          description: formData.description,
          status,
          disponibilite,
          images,
        });

        if (result) {
          set((state) => ({
            listings: state.listings.map((l) =>
              l.id === localListing.id ? { ...l, id: result.id } : l
            ),
          }));
        }
      } catch (err) {
        set((state) => ({ listings: state.listings.filter((l) => l.id !== localListing.id) }));
        if (__DEV__) console.error('addListing error:', err);
      }
    }
  },

  removeListing: async (id) => {
    const previous = get().listings;
    set({ listings: previous.filter((l) => l.id !== id) });
    try {
      await deleteSupabaseHebergement(id);
    } catch (err) {
      set({ listings: previous });
      if (__DEV__) console.error('removeListing error:', err);
    }
  },

  toggleStatus: async (id) => {
    const previous = get().listings;
    const listing = previous.find((l) => l.id === id);
    if (!listing) return;
    const newStatus = listing.status === 'actif' ? 'inactif' : 'actif';
    set({
      listings: previous.map((l) =>
        l.id === id ? { ...l, status: newStatus as 'actif' | 'inactif' } : l
      ),
    });
    try {
      await toggleSupabaseStatus(id, newStatus);
    } catch (err) {
      set({ listings: previous });
      if (__DEV__) console.error('toggleStatus error:', err);
    }
  },

  updateForm: (field, value: string | boolean) => {
    set({ formData: { ...get().formData, [field]: value } });
  },

  addFormImage: (uri) => {
    const { formData } = get();
    if (formData.images.length >= 5) return;
    set({ formData: { ...formData, images: [...formData.images, uri] } });
  },

  removeFormImage: (index) => {
    const { formData } = get();
    set({ formData: { ...formData, images: formData.images.filter((_, i) => i !== index) } });
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
        disponibilite: h.disponibilite ?? 1,
        images: h.images || [],
        createdAt: h.created_at,
      }));
      set({ listings });
    } catch (err) {
      if (__DEV__) console.error('loadListings error:', err);
    } finally {
      set({ isLoading: false });
    }
  },
}));
