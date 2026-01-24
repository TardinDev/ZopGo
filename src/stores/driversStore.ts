import { create } from 'zustand';
import { Livreur } from '../types';
import { livreurs } from '../data/livreurs';

interface DriversState {
  // Chauffeurs connectés (ajoutés dynamiquement)
  connectedDrivers: Livreur[];

  // Actions
  addConnectedDriver: (driver: Livreur) => void;
  removeConnectedDriver: (driverId: number) => void;
  updateDriverAvailability: (driverId: number, disponible: boolean) => void;

  // Getters
  getAllDrivers: () => Livreur[];
  getAvailableDrivers: () => Livreur[];
}

export const useDriversStore = create<DriversState>((set, get) => ({
  connectedDrivers: [],

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

  getAllDrivers: () => {
    const { connectedDrivers } = get();
    // Combiner les livreurs statiques avec les chauffeurs connectés
    const allDrivers = [...livreurs];

    // Ajouter les chauffeurs connectés qui ne sont pas déjà dans la liste
    connectedDrivers.forEach((driver) => {
      if (!allDrivers.find((d) => d.id === driver.id)) {
        allDrivers.push(driver);
      }
    });

    // Trier par distance
    return allDrivers.sort((a, b) => a.distance - b.distance);
  },

  getAvailableDrivers: () => {
    return get()
      .getAllDrivers()
      .filter((d) => d.disponible);
  },
}));
