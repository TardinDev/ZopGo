import { create } from 'zustand';
import { vehicles as initialVehicles } from '../data';
import { Vehicle } from '../data/location';

export type VehicleType = 'tous' | 'voiture' | 'moto' | 'utilitaire';

interface LocationState {
  // État
  searchQuery: string;
  selectedType: VehicleType;
  filteredVehicles: Vehicle[];
  favorites: string[]; // IDs des favoris

  // Actions
  setSearchQuery: (query: string) => void;
  setSelectedType: (type: VehicleType) => void;
  toggleFavorite: (id: string) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  // État initial
  searchQuery: '',
  selectedType: 'tous',
  filteredVehicles: initialVehicles,
  favorites: [],

  // Actions
  setSearchQuery: (query) =>
    set((state) => {
      const filtered = filterVehicles(initialVehicles, query, state.selectedType);
      return { searchQuery: query, filteredVehicles: filtered };
    }),

  setSelectedType: (type) =>
    set((state) => {
      const filtered = filterVehicles(initialVehicles, state.searchQuery, type);
      return { selectedType: type, filteredVehicles: filtered };
    }),

  toggleFavorite: (id) =>
    set((state) => {
      const isFavorite = state.favorites.includes(id);
      return {
        favorites: isFavorite
          ? state.favorites.filter((favId) => favId !== id)
          : [...state.favorites, id],
      };
    }),
}));

// Helper function for filtering
function filterVehicles(allVehicles: Vehicle[], query: string, type: VehicleType): Vehicle[] {
  return allVehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.name.toLowerCase().includes(query.toLowerCase()) ||
      vehicle.location.toLowerCase().includes(query.toLowerCase());
    const matchesType = type === 'tous' || vehicle.type === type;

    return matchesSearch && matchesType;
  });
}
