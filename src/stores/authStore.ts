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

  // Actions
  setupProfile: (
    role: UserRole,
    name: string,
    email: string,
    vehicleType?: VehicleType
  ) => void;
  logout: () => void;
  updateProfile: (profile: Partial<UserInfo | ChauffeurProfile>) => void;
  setDisponible: (disponible: boolean) => void;
}

// Profil client par défaut
const createClientProfile = (name: string, email: string): UserInfo => ({
  name,
  email,
  phone: '',
  avatar:
    'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=150&h=150&fit=crop&crop=face',
  rating: 5.0,
  totalTrips: 0,
  totalDeliveries: 0,
  memberSince: new Date().getFullYear().toString(),
});

// Profil chauffeur par défaut
const createChauffeurProfile = (
  name: string,
  email: string,
  vehicleType: VehicleType = 'moto'
): ChauffeurProfile => ({
  name,
  email,
  phone: '',
  avatar:
    'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=150&h=150&fit=crop&crop=face',
  rating: 5.0,
  totalTrips: 0,
  totalDeliveries: 0,
  memberSince: new Date().getFullYear().toString(),
  vehicule: VEHICLE_TYPES[vehicleType],
  disponible: true,
});

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,

  setupProfile: (role, name, email, vehicleType) => {
    const profile =
      role === 'chauffeur'
        ? createChauffeurProfile(name, email, vehicleType)
        : createClientProfile(name, email);

    const newUser: AuthUser = {
      id: Date.now().toString(),
      role,
      profile,
    };

    set({ user: newUser });

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

    set({ user: null });
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
    prenom: profile.name.split(' ')[0],
    vehicule: `${profile.vehicule.icon} ${profile.vehicule.label}`,
    etoiles: profile.rating,
    disponible: profile.disponible,
    photo: profile.avatar,
    commentaires: ['Nouveau chauffeur', 'Inscrit récemment'],
    distance: Math.random() * 3 + 0.5,
  };
};
