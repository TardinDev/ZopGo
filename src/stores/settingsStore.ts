import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { VehicleType } from '../types';

// --- Types ---

export interface SettingsVehicle {
  id: string;
  label: string;
  type: VehicleType;
  plaque: string;
  isDefault: boolean;
}

export type PaymentProviderType = 'visa' | 'mastercard' | 'airtel_money' | 'moov_money';

export interface PaymentMethod {
  id: string;
  type: 'card' | 'mobile_money';
  label: string;
  lastDigits: string;
  provider: PaymentProviderType;
  isDefault: boolean;
}

export type AddressIcon = 'home' | 'briefcase' | 'star' | 'heart' | 'location';

export interface FavoriteAddress {
  id: string;
  label: string;
  address: string;
  icon: AddressIcon;
}

export interface GeneralSettings {
  language: 'fr' | 'en';
  darkMode: boolean;
  shareLocation: boolean;
}

// --- State ---

interface SettingsState {
  vehicles: SettingsVehicle[];
  paymentMethods: PaymentMethod[];
  favoriteAddresses: FavoriteAddress[];
  generalSettings: GeneralSettings;

  // Vehicles
  addVehicle: (vehicle: Omit<SettingsVehicle, 'id'>) => void;
  updateVehicle: (id: string, updates: Partial<Omit<SettingsVehicle, 'id'>>) => void;
  removeVehicle: (id: string) => void;
  setDefaultVehicle: (id: string) => void;

  // Payment methods
  addPaymentMethod: (method: Omit<PaymentMethod, 'id'>) => void;
  updatePaymentMethod: (id: string, updates: Partial<Omit<PaymentMethod, 'id'>>) => void;
  removePaymentMethod: (id: string) => void;
  setDefaultPaymentMethod: (id: string) => void;

  // Favorite addresses
  addFavoriteAddress: (address: Omit<FavoriteAddress, 'id'>) => void;
  updateFavoriteAddress: (id: string, updates: Partial<Omit<FavoriteAddress, 'id'>>) => void;
  removeFavoriteAddress: (id: string) => void;

  // General settings
  updateGeneralSettings: (updates: Partial<GeneralSettings>) => void;
}

const generateId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      vehicles: [],
      paymentMethods: [],
      favoriteAddresses: [],
      generalSettings: {
        language: 'fr',
        darkMode: false,
        shareLocation: true,
      },

      // --- Vehicles ---
      addVehicle: (vehicle) =>
        set((state) => ({
          vehicles: [
            ...state.vehicles.map((v) => (vehicle.isDefault ? { ...v, isDefault: false } : v)),
            { ...vehicle, id: generateId() },
          ],
        })),

      updateVehicle: (id, updates) =>
        set((state) => ({
          vehicles: state.vehicles.map((v) => (v.id === id ? { ...v, ...updates } : v)),
        })),

      removeVehicle: (id) =>
        set((state) => ({
          vehicles: state.vehicles.filter((v) => v.id !== id),
        })),

      setDefaultVehicle: (id) =>
        set((state) => ({
          vehicles: state.vehicles.map((v) => ({
            ...v,
            isDefault: v.id === id,
          })),
        })),

      // --- Payment methods ---
      addPaymentMethod: (method) =>
        set((state) => ({
          paymentMethods: [
            ...state.paymentMethods.map((m) =>
              method.isDefault ? { ...m, isDefault: false } : m
            ),
            { ...method, id: generateId() },
          ],
        })),

      updatePaymentMethod: (id, updates) =>
        set((state) => ({
          paymentMethods: state.paymentMethods.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })),

      removePaymentMethod: (id) =>
        set((state) => ({
          paymentMethods: state.paymentMethods.filter((m) => m.id !== id),
        })),

      setDefaultPaymentMethod: (id) =>
        set((state) => ({
          paymentMethods: state.paymentMethods.map((m) => ({
            ...m,
            isDefault: m.id === id,
          })),
        })),

      // --- Favorite addresses ---
      addFavoriteAddress: (address) =>
        set((state) => ({
          favoriteAddresses: [...state.favoriteAddresses, { ...address, id: generateId() }],
        })),

      updateFavoriteAddress: (id, updates) =>
        set((state) => ({
          favoriteAddresses: state.favoriteAddresses.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        })),

      removeFavoriteAddress: (id) =>
        set((state) => ({
          favoriteAddresses: state.favoriteAddresses.filter((a) => a.id !== id),
        })),

      // --- General settings ---
      updateGeneralSettings: (updates) =>
        set((state) => ({
          generalSettings: { ...state.generalSettings, ...updates },
        })),
    }),
    {
      name: 'zopgo-settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
