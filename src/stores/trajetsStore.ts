import { create } from 'zustand';
import { Trajet, VehicleType } from '../types';

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

  // Actions
  addTrajet: (chauffeurId: string) => void;
  removeTrajet: (id: string) => void;
  updateForm: (field: keyof TrajetFormData, value: string) => void;
  resetForm: () => void;
}

export const useTrajetsStore = create<TrajetsState>((set, get) => ({
  trajets: [],
  formData: { ...initialFormData },

  addTrajet: (chauffeurId) => {
    const { formData, trajets } = get();
    const newTrajet: Trajet = {
      id: Date.now().toString(),
      chauffeurId,
      villeDepart: formData.villeDepart,
      villeArrivee: formData.villeArrivee,
      prix: parseInt(formData.prix) || 0,
      vehicule: formData.vehicule,
      date: formData.date || new Date().toISOString(),
      placesDisponibles: parseInt(formData.placesDisponibles) || 1,
      createdAt: new Date().toISOString(),
    };
    set({ trajets: [newTrajet, ...trajets], formData: { ...initialFormData } });
  },

  removeTrajet: (id) => {
    set({ trajets: get().trajets.filter((t) => t.id !== id) });
  },

  updateForm: (field, value) => {
    set({ formData: { ...get().formData, [field]: value } });
  },

  resetForm: () => {
    set({ formData: { ...initialFormData } });
  },
}));
