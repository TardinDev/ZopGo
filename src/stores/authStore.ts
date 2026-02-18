import * as Sentry from '@sentry/react-native';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AuthUser,
  UserRole,
  ChauffeurProfile,
  UserInfo,
  VehicleType,
  VehicleInfo,
  Livreur,
  NotificationPreferences,
} from '../types';
import { useDriversStore } from './driversStore';
import { upsertProfile, fetchProfileByClerkId, updateProfile as updateSupabaseProfile } from '../lib/supabaseProfile';
import { fetchNotificationPreferences, updateNotificationPreferences, updatePushToken } from '../lib/supabaseNotifications';

// Mapping des types de véhicules
export const VEHICLE_TYPES: Record<VehicleType, VehicleInfo> = {
  velo: { type: 'velo', label: 'Vélo', icon: '🚲' },
  moto: { type: 'moto', label: 'Moto', icon: '🏍️' },
  voiture: { type: 'voiture', label: 'Voiture', icon: '🚗' },
  camionnette: { type: 'camionnette', label: 'Camionnette', icon: '🚚' },
};

const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  courses: true,
  trajets: true,
  promotions: true,
};

interface AuthState {
  user: AuthUser | null;
  clerkId: string | null;
  supabaseProfileId: string | null;
  notificationPreferences: NotificationPreferences;
  _hasHydrated: boolean;

  // Actions
  setHasHydrated: (value: boolean) => void;
  setupProfile: (
    role: UserRole,
    name: string,
    email: string,
    vehicleType?: VehicleType,
    clerkId?: string
  ) => void;
  logout: () => void;
  updateProfile: (profile: Partial<UserInfo | ChauffeurProfile>) => void;
  setDisponible: (disponible: boolean) => void;
  loadNotificationPreferences: (clerkId: string) => Promise<void>;
  setNotificationPreferences: (prefs: NotificationPreferences) => void;
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      clerkId: null,
      supabaseProfileId: null,
      notificationPreferences: DEFAULT_NOTIFICATION_PREFS,
      _hasHydrated: false,

      setHasHydrated: (value) => set({ _hasHydrated: value }),

      setupProfile: (role, name, email, vehicleType, clerkId) => {
        const profile =
          role === 'chauffeur'
            ? createChauffeurProfile(name, email, vehicleType)
            : createClientProfile(name, email);

        const newUser: AuthUser = {
          id: clerkId || Date.now().toString(),
          role,
          profile,
        };

        set({ user: newUser, clerkId: clerkId || null });

        // Si c'est un chauffeur, l'ajouter à la liste des chauffeurs disponibles
        if (role === 'chauffeur') {
          const livreur = chauffeurToLivreur(newUser);
          useDriversStore.getState().addConnectedDriver(livreur);
        }

        // Persister en Supabase de manière async
        if (clerkId) {
          (async () => {
            try {
              const existing = await fetchProfileByClerkId(clerkId);
              if (existing) {
                // Hydrater les stats depuis Supabase
                set((state) => {
                  if (!state.user) return state;
                  return {
                    supabaseProfileId: existing.id,
                    user: {
                      ...state.user,
                      profile: {
                        ...state.user.profile,
                        rating: existing.rating,
                        totalTrips: existing.total_trips,
                        totalDeliveries: existing.total_deliveries,
                        memberSince: new Date(existing.member_since).getFullYear().toString(),
                      },
                    },
                  };
                });
                // Load notification preferences
                const prefs = await fetchNotificationPreferences(clerkId);
                set({ notificationPreferences: prefs });
              } else {
                const created = await upsertProfile(clerkId, {
                  role,
                  name,
                  email,
                  disponible: role === 'chauffeur',
                });
                if (created) {
                  set({ supabaseProfileId: created.id });
                }
              }
            } catch (err) {
              Sentry.captureException(err);
            }
          })();
        }
      },

      logout: () => {
        const { user, clerkId } = get();

        // Si c'était un chauffeur, le retirer de la liste des chauffeurs disponibles
        if (user && user.role === 'chauffeur') {
          useDriversStore.getState().removeConnectedDriver(parseInt(user.id) || 0);
        }

        // Clear push token in Supabase
        if (clerkId) {
          updatePushToken(clerkId, null);
        }

        set({
          user: null,
          clerkId: null,
          supabaseProfileId: null,
          notificationPreferences: DEFAULT_NOTIFICATION_PREFS,
        });
      },

      updateProfile: (updates) => {
        const { user, clerkId } = get();
        if (!user) return;

        set({
          user: {
            ...user,
            profile: { ...user.profile, ...updates },
          },
        });

        // Sync avec Supabase
        if (clerkId) {
          const supabaseUpdates: Record<string, any> = {};
          if ('name' in updates && updates.name) supabaseUpdates.name = updates.name;
          if ('phone' in updates && updates.phone) supabaseUpdates.phone = updates.phone;
          if ('avatar' in updates && updates.avatar) supabaseUpdates.avatar = updates.avatar;
          if (Object.keys(supabaseUpdates).length > 0) {
            updateSupabaseProfile(clerkId, supabaseUpdates);
          }
        }
      },

      setDisponible: (disponible) => {
        const { user, clerkId } = get();
        if (!user || user.role !== 'chauffeur') return;

        set({
          user: {
            ...user,
            profile: { ...(user.profile as ChauffeurProfile), disponible },
          },
        });

        // Mettre à jour la disponibilité dans le driversStore
        useDriversStore.getState().updateDriverAvailability(parseInt(user.id) || 0, disponible);

        // Sync avec Supabase
        if (clerkId) {
          updateSupabaseProfile(clerkId, { disponible });
        }
      },

      loadNotificationPreferences: async (clerkId: string) => {
        const prefs = await fetchNotificationPreferences(clerkId);
        set({ notificationPreferences: prefs });
      },

      setNotificationPreferences: (prefs: NotificationPreferences) => {
        const { clerkId } = get();
        set({ notificationPreferences: prefs });
        if (clerkId) {
          updateNotificationPreferences(clerkId, prefs);
        }
      },
    }),
    {
      name: 'zopgo-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        clerkId: state.clerkId,
        supabaseProfileId: state.supabaseProfileId,
        notificationPreferences: state.notificationPreferences,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

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
