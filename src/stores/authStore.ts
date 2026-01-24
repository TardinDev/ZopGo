import { create } from 'zustand';
import {
  AuthUser,
  UserRole,
  ChauffeurProfile,
  UserInfo,
  VehicleType,
  VehicleInfo,
  Livreur,
} from '../types';
import { useDriversStore } from './driversStore';

// Mapping des types de véhicules
export const VEHICLE_TYPES: Record<VehicleType, VehicleInfo> = {
  velo: { type: 'velo', label: 'Vélo', icon: '🚲' },
  moto: { type: 'moto', label: 'Moto', icon: '🏍️' },
  voiture: { type: 'voiture', label: 'Voiture', icon: '🚗' },
  camionnette: { type: 'camionnette', label: 'Camionnette', icon: '🚚' },
};

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (
    email: string,
    password: string,
    role: UserRole,
    vehicleType?: VehicleType
  ) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    vehicleType?: VehicleType
  ) => Promise<void>;
  logout: () => void;
  updateProfile: (profile: Partial<UserInfo | ChauffeurProfile>) => void;
  setDisponible: (disponible: boolean) => void;
}

// Profil client par défaut (pour démo)
const defaultClientProfile: UserInfo = {
  name: 'Pierre Ondo Mba',
  email: 'pierre.ondo@gmail.com',
  phone: '+241 06 12 34 56',
  avatar:
    'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=150&h=150&fit=crop&crop=face',
  rating: 4.8,
  totalTrips: 156,
  totalDeliveries: 89,
  memberSince: '2023',
};

// Profil chauffeur par défaut (pour démo)
const defaultChauffeurProfile: ChauffeurProfile = {
  name: 'Pierre Ondo Mba',
  email: 'pierre.ondo@gmail.com',
  phone: '+241 06 12 34 56',
  avatar:
    'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=150&h=150&fit=crop&crop=face',
  rating: 4.8,
  totalTrips: 156,
  totalDeliveries: 89,
  memberSince: '2023',
  vehicule: VEHICLE_TYPES.moto,
  disponible: true,
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email, password, role, vehicleType) => {
    set({ isLoading: true });

    // Simulation d'une requête API
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const profile =
      role === 'chauffeur'
        ? {
            ...defaultChauffeurProfile,
            email,
            vehicule: vehicleType ? VEHICLE_TYPES[vehicleType] : VEHICLE_TYPES.moto,
          }
        : { ...defaultClientProfile, email };

    const newUser = {
      id: Date.now().toString(),
      role,
      profile,
    };

    set({
      user: newUser,
      isAuthenticated: true,
      isLoading: false,
    });

    // Si c'est un chauffeur, l'ajouter à la liste des chauffeurs disponibles
    if (role === 'chauffeur') {
      const livreur = chauffeurToLivreur(newUser);
      useDriversStore.getState().addConnectedDriver(livreur);
    }
  },

  register: async (name, email, password, role, vehicleType) => {
    set({ isLoading: true });

    // Simulation d'une requête API
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const baseProfile = {
      name,
      email,
      phone: '',
      avatar:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      rating: 5.0,
      totalTrips: 0,
      totalDeliveries: 0,
      memberSince: new Date().getFullYear().toString(),
    };

    const profile: UserInfo | ChauffeurProfile =
      role === 'chauffeur'
        ? {
            ...baseProfile,
            vehicule: vehicleType ? VEHICLE_TYPES[vehicleType] : VEHICLE_TYPES.moto,
            disponible: true,
          }
        : baseProfile;

    const newUser = {
      id: Date.now().toString(),
      role,
      profile,
    };

    set({
      user: newUser,
      isAuthenticated: true,
      isLoading: false,
    });

    // Si c'est un chauffeur, l'ajouter à la liste des chauffeurs disponibles
    if (role === 'chauffeur') {
      const livreur = chauffeurToLivreur(newUser);
      useDriversStore.getState().addConnectedDriver(livreur);
    }
  },

  logout: () => {
    const { user } = get();

    // Si c'était un chauffeur, le retirer de la liste des chauffeurs disponibles
    if (user && user.role === 'chauffeur') {
      useDriversStore.getState().removeConnectedDriver(parseInt(user.id) || 0);
    }

    set({
      user: null,
      isAuthenticated: false,
    });
  },

  updateProfile: (updates) => {
    const { user } = get();
    if (!user) return;

    set({
      user: {
        ...user,
        profile: { ...user.profile, ...updates },
      },
    });
  },

  setDisponible: (disponible) => {
    const { user } = get();
    if (!user || user.role !== 'chauffeur') return;

    set({
      user: {
        ...user,
        profile: { ...(user.profile as ChauffeurProfile), disponible },
      },
    });

    // Mettre à jour la disponibilité dans le driversStore
    useDriversStore.getState().updateDriverAvailability(parseInt(user.id) || 0, disponible);
  },
}));

// Helper pour vérifier si l'utilisateur est un chauffeur
export const isChauffeur = (
  user: AuthUser | null
): user is AuthUser & { profile: ChauffeurProfile } => {
  return user?.role === 'chauffeur';
};

// Helper pour convertir un ChauffeurProfile en Livreur
export const chauffeurToLivreur = (user: AuthUser): Livreur => {
  const profile = user.profile as ChauffeurProfile;
  return {
    id: parseInt(user.id) || Date.now(),
    prenom: profile.name.split(' ')[0], // Prénom uniquement
    vehicule: `${profile.vehicule.icon} ${profile.vehicule.label}`,
    etoiles: profile.rating,
    disponible: profile.disponible,
    photo: profile.avatar,
    commentaires: ['Nouveau chauffeur', 'Inscrit récemment'],
    distance: Math.random() * 3 + 0.5, // Distance aléatoire entre 0.5 et 3.5 km
  };
};
