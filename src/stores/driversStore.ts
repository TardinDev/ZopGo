import { create } from 'zustand';
import { Livreur } from '../types';
import { supabase } from '../lib/supabase';
import { checkNetwork } from '../hooks/useNetworkStatus';

interface SupabaseProfileRow {
  id: string;
  clerk_id?: string;
  name: string;
  rating?: number;
  disponible: boolean;
  avatar?: string;
}

interface DriversState {
  connectedDrivers: Livreur[];
  isLoading: boolean;

  addConnectedDriver: (driver: Livreur) => void;
  removeConnectedDriver: (driverId: string) => void;
  updateDriverAvailability: (driverId: string, disponible: boolean) => void;
  loadDrivers: () => Promise<void>;

  getAllDrivers: () => Livreur[];
  getAvailableDrivers: () => Livreur[];
}

export const useDriversStore = create<DriversState>((set, get) => ({
  connectedDrivers: [],
  isLoading: false,

  addConnectedDriver: (driver) => {
    set((state) => {
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
      const connected = await checkNetwork();
      if (!connected) {
        set({ isLoading: false });
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'chauffeur')
        .eq('disponible', true)
        .limit(50);

      if (error) {
        if (__DEV__) console.error('Error loading drivers:', error.message);
        return;
      }

      if (data) {
        const drivers: Livreur[] = data.map((d: SupabaseProfileRow) => ({
          id: d.clerk_id || d.id,
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
      if (__DEV__) console.error('loadDrivers error:', err);
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
