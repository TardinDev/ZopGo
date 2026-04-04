import { create } from 'zustand';
import { fetchAllAvailableTrajets } from '../lib/supabaseTrajets';
import type { Voyage } from '../types';

const VEHICLE_LABEL: Record<string, string> = {
  moto: 'Moto',
  voiture: 'Voiture',
  camionnette: 'Camionnette',
};

const VEHICLE_ICON: Record<string, string> = {
  moto: '🏍️',
  voiture: '🚗',
  camionnette: '🚐',
};

export const transportTypes = ['All', 'Moto', 'Voiture', 'Camionnette'];

interface VoyagesState {
  trajets: Voyage[];
  isLoading: boolean;
  selectedType: string;
  fromCity: string;
  toCity: string;

  loadVoyages: () => Promise<void>;
  setSelectedType: (type: string) => void;
  setFromCity: (city: string) => void;
  setToCity: (city: string) => void;
  swapCities: () => void;
  resetFilters: () => void;
}

export const useVoyagesStore = create<VoyagesState>((set, get) => ({
  trajets: [],
  isLoading: false,
  selectedType: 'All',
  fromCity: '',
  toCity: '',

  loadVoyages: async () => {
    set({ isLoading: true });
    try {
      const data = await fetchAllAvailableTrajets();
      const mapped: Voyage[] = data.map((t) => ({
        id: t.id,
        type: VEHICLE_LABEL[t.vehicule] || t.vehicule,
        from: t.ville_depart,
        to: t.ville_arrivee,
        price: `${t.prix} FCFA`,
        icon: VEHICLE_ICON[t.vehicule] || '🚗',
        chauffeurName: t.profiles?.name,
        chauffeurAvatar: t.profiles?.avatar,
        chauffeurRating: t.profiles?.rating,
        chauffeurProfileId: t.chauffeur_id,
        placesDisponibles: t.places_disponibles,
        date: t.date || undefined,
        marque: t.marque || undefined,
        modele: t.modele || undefined,
        couleur: t.couleur || undefined,
      }));
      set({ trajets: mapped });
    } catch (err) {
      if (__DEV__) console.error('loadVoyages error:', err);
    } finally {
      set({ isLoading: false });
    }
  },
  setSelectedType: (type) => set({ selectedType: type }),
  setFromCity: (city) => set({ fromCity: city }),
  setToCity: (city) => set({ toCity: city }),
  swapCities: () => {
    const { fromCity, toCity } = get();
    set({ fromCity: toCity, toCity: fromCity });
  },
  resetFilters: () =>
    set({
      selectedType: 'All',
      fromCity: '',
      toCity: '',
    }),
}));
