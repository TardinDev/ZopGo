import { create } from 'zustand';
import { fetchAllAvailableTrajets } from '../lib/supabaseTrajets';
import type { Voyage } from '../types';
import type { DepartureWindow, VoyageSort } from '../lib/voyagesFilters';

// moto stays mapped so legacy trajets in the DB still display with the right
// label/icon, but it is intentionally absent from `transportTypes` because
// chauffeurs no longer create moto trajets — moto is a livraisons-only mode.
const VEHICLE_LABEL: Record<string, string> = {
  moto: 'Moto',
  voiture: 'Voiture',
  camionnette: 'Camionnette',
  bus: 'Bus',
};

const VEHICLE_ICON: Record<string, string> = {
  moto: '🏍️',
  voiture: '🚗',
  camionnette: '🚐',
  bus: '🚌',
};

export const transportTypes = ['All', 'Voiture', 'Camionnette', 'Bus'];

interface VoyagesState {
  trajets: Voyage[];
  isLoading: boolean;
  error: string | null;
  selectedType: string;
  fromCity: string;
  toCity: string;
  priceMax: number | null;
  departureWindow: DepartureWindow | null;
  sortBy: VoyageSort;

  loadVoyages: () => Promise<void>;
  setSelectedType: (type: string) => void;
  setFromCity: (city: string) => void;
  setToCity: (city: string) => void;
  swapCities: () => void;
  setPriceMax: (price: number | null) => void;
  setDepartureWindow: (w: DepartureWindow | null) => void;
  setSortBy: (s: VoyageSort) => void;
  resetFilters: () => void;
}

export const useVoyagesStore = create<VoyagesState>((set, get) => ({
  trajets: [],
  isLoading: false,
  error: null,
  selectedType: 'All',
  fromCity: '',
  toCity: '',
  priceMax: null,
  departureWindow: null,
  sortBy: 'default',

  loadVoyages: async () => {
    set({ isLoading: true, error: null });
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
      set({ trajets: mapped, error: null });
    } catch (err) {
      console.warn('[loadVoyages] FAILED', err instanceof Error ? err.message : err);
      // Distinguish a failed fetch from an empty result so the UI shows a
      // retry banner rather than the cheerful "Les chauffeurs dorment encore"
      // empty state.
      set({ error: 'Impossible de charger les trajets. Vérifie ta connexion.' });
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
  setPriceMax: (priceMax) => set({ priceMax }),
  setDepartureWindow: (departureWindow) => set({ departureWindow }),
  setSortBy: (sortBy) => set({ sortBy }),
  resetFilters: () =>
    set({
      selectedType: 'All',
      fromCity: '',
      toCity: '',
      priceMax: null,
      departureWindow: null,
      sortBy: 'default',
    }),
}));
