import * as Sentry from '@sentry/react-native';
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
  // État
  trajets: Voyage[];
  isLoading: boolean;
  selectedType: string;
  fromCity: string;
  toCity: string;

  // Actions
  loadVoyages: () => Promise<void>;
  setSelectedType: (type: string) => void;
  setFromCity: (city: string) => void;
  setToCity: (city: string) => void;
  swapCities: () => void;
  resetFilters: () => void;
}

export const useVoyagesStore = create<VoyagesState>((set, get) => ({
  // État initial
  trajets: [],
  isLoading: false,
  selectedType: 'All',
  fromCity: '',
  toCity: '',

  // Actions
  loadVoyages: async () => {
    set({ isLoading: true });
    try {
      const data = await fetchAllAvailableTrajets();
      const mapped: Voyage[] = data.map((t, index) => ({
        id: index + 1,
        type: VEHICLE_LABEL[t.vehicule] || t.vehicule,
        from: t.ville_depart,
        to: t.ville_arrivee,
        price: `${t.prix} FCFA`,
        icon: VEHICLE_ICON[t.vehicule] || '🚗',
      }));
      set({ trajets: mapped });
    } catch (err) {
      Sentry.captureException(err);
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
