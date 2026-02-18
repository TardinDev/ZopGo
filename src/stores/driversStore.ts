import * as Sentry from '@sentry/react-native';
import { create } from 'zustand';
import { Livreur } from '../types';
import { supabase } from '../lib/supabase';

interface DriversState {
  // Chauffeurs connectés (ajoutés dynamiquement)
  connectedDrivers: Livreur[];
  isLoading: boolean;

  // Actions
  addConnectedDriver: (driver: Livreur) => void;
  removeConnectedDriver: (driverId: number) => void;
  updateDriverAvailability: (driverId: number, disponible: boolean) => void;
  loadDrivers: () => Promise<void>;

  // Getters
  getAllDrivers: () => Livreur[];
  getAvailableDrivers: () => Livreur[];
}

export const useDriversStore = create<DriversState>((set, get) => ({
  connectedDrivers: [],
  isLoading: false,

  addConnectedDriver: (driver) => {
    set((state) => {
      // Éviter les doublons
      const exists = state.connectedDrivers.find((d) => d.id === driver.id);
      if (exists) {
        return {
          connectedDrivers: state.connectedDrivers.map((d) => (d.id === driver.id ? driver : d)),
        };
      }
      return {
        connectedDrivers: [...state.connectedDrivers, driver],
      };
    });
  },

  removeConnectedDriver: (driverId) => {
    set((state) => ({
      connectedDrivers: state.connectedDrivers.filter((d) => d.id !== driverId),
    }));
  },

  updateDriverAvailability: (driverId, disponible) => {
    set((state) => ({
      connectedDrivers: state.connectedDrivers.map((d) =>
        d.id === driverId ? { ...d, disponible } : d
      ),
    }));
  },

  loadDrivers: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'chauffeur')
        .eq('disponible', true)
        .limit(50);

      if (error) {
        Sentry.captureException(new Error(`Error loading drivers: ${error.message}`));
        return;
      }

      if (data) {
        const drivers: Livreur[] = data.map((d: any) => ({
          id: parseInt(d.clerk_id) || Date.now(),
          prenom: d.name.split(' ')[0],
          vehicule: '🚗 Voiture',
          etoiles: d.rating || 5.0,
          disponible: d.disponible,
          photo: d.avatar || 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=150&h=150&fit=crop&crop=face',
          commentaires: [],
          distance: Math.random() * 3 + 0.5,
        }));
        set({ connectedDrivers: drivers });
      }
    } catch (err) {
      Sentry.captureException(err);
    } finally {
      set({ isLoading: false });
    }
  },

  getAllDrivers: () => {
    const { connectedDrivers } = get();
    return [...connectedDrivers].sort((a, b) => a.distance - b.distance);
  },

  getAvailableDrivers: () => {
    return get()
      .getAllDrivers()
      .filter((d) => d.disponible);
  },
}));
