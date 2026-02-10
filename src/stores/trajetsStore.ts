import { create } from 'zustand';
import { Trajet, VehicleType } from '../types';
import {
  fetchTrajets as fetchSupabaseTrajets,
  insertTrajet,
  deleteTrajet as deleteSupabaseTrajet,
  markTrajetEffectue as markSupabaseTrajetEffectue,
} from '../lib/supabaseTrajets';

interface TrajetFormData {
  villeDepart: string;
  villeArrivee: string;
  prix: string;
  vehicule: VehicleType;
  date: string;
  placesDisponibles: string;
}

const initialFormData: TrajetFormData = {
  villeDepart: '',
  villeArrivee: '',
  prix: '',
  vehicule: 'voiture',
  date: '',
  placesDisponibles: '1',
};

interface TrajetsState {
  trajets: Trajet[];
  formData: TrajetFormData;
  isLoading: boolean;

  // Actions
  addTrajet: (chauffeurId: string, supabaseProfileId?: string) => Promise<void>;
  removeTrajet: (id: string) => Promise<void>;
  markEffectue: (id: string) => Promise<void>;
  updateForm: (field: keyof TrajetFormData, value: string) => void;
  resetForm: () => void;
  loadTrajets: (supabaseProfileId: string) => Promise<void>;
}

export const useTrajetsStore = create<TrajetsState>((set, get) => ({
  trajets: [],
  formData: { ...initialFormData },
  isLoading: false,

  addTrajet: async (chauffeurId, supabaseProfileId) => {
    const { formData, trajets } = get();

    // Créer localement d'abord
    const localTrajet: Trajet = {
      id: Date.now().toString(),
      chauffeurId,
      villeDepart: formData.villeDepart,
      villeArrivee: formData.villeArrivee,
      prix: parseInt(formData.prix) || 0,
      vehicule: formData.vehicule,
      date: formData.date || new Date().toISOString(),
      placesDisponibles: parseInt(formData.placesDisponibles) || 1,
      status: 'en_attente',
      createdAt: new Date().toISOString(),
    };
    set({ trajets: [localTrajet, ...trajets], formData: { ...initialFormData } });

    // Persister en Supabase
    if (supabaseProfileId) {
      const result = await insertTrajet({
        chauffeur_id: supabaseProfileId,
        ville_depart: formData.villeDepart,
        ville_arrivee: formData.villeArrivee,
        prix: parseInt(formData.prix) || 0,
        vehicule: formData.vehicule,
        date: formData.date || undefined,
        places_disponibles: parseInt(formData.placesDisponibles) || 1,
      });

      // Mettre à jour l'id local avec l'id Supabase
      if (result) {
        set((state) => ({
          trajets: state.trajets.map((t) =>
            t.id === localTrajet.id ? { ...t, id: result.id } : t
          ),
        }));
      }
    }
  },

  removeTrajet: async (id) => {
    set({ trajets: get().trajets.filter((t) => t.id !== id) });
    await deleteSupabaseTrajet(id);
  },

  markEffectue: async (id) => {
    set({
      trajets: get().trajets.map((t) =>
        t.id === id ? { ...t, status: 'effectue' as const } : t
      ),
    });
    await markSupabaseTrajetEffectue(id);
  },

  updateForm: (field, value) => {
    set({ formData: { ...get().formData, [field]: value } });
  },

  resetForm: () => {
    set({ formData: { ...initialFormData } });
  },

  loadTrajets: async (supabaseProfileId) => {
    set({ isLoading: true });
    try {
      const data = await fetchSupabaseTrajets(supabaseProfileId);
      const trajets: Trajet[] = data.map((t) => ({
        id: t.id,
        chauffeurId: t.chauffeur_id,
        villeDepart: t.ville_depart,
        villeArrivee: t.ville_arrivee,
        prix: t.prix,
        vehicule: t.vehicule as VehicleType,
        date: t.date || '',
        placesDisponibles: t.places_disponibles,
        status: t.status as 'en_attente' | 'effectue',
        createdAt: t.created_at,
      }));
      set({ trajets });
    } catch (err) {
      console.error('Error loading trajets:', err);
    } finally {
      set({ isLoading: false });
    }
  },
}));
