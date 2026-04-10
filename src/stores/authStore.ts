import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AuthUser,
  UserRole,
  ChauffeurProfile,
  HebergeurProfile,
  UserInfo,
  VehicleType,
  VehicleInfo,
  AccommodationType,
  AccommodationInfo,
  Livreur,
  NotificationPreferences,
} from '../types';
import { useDriversStore } from './driversStore';
import { upsertProfile, fetchProfileByClerkId, updateProfile as updateSupabaseProfile } from '../lib/supabaseProfile';
import { fetchNotificationPreferences, updateNotificationPreferences, updatePushToken } from '../lib/supabaseNotifications';
import { generateAvatarPlaceholder } from '../lib/supabaseAvatar';

export const VEHICLE_TYPES: Record<VehicleType, VehicleInfo> = {
  velo: { type: 'velo', label: 'Vélo', icon: '🚲' },
  moto: { type: 'moto', label: 'Moto', icon: '🏍️' },
  voiture: { type: 'voiture', label: 'Voiture', icon: '🚗' },
  camionnette: { type: 'camionnette', label: 'Camionnette', icon: '🚚' },
};

export const ACCOMMODATION_TYPES: Record<AccommodationType, AccommodationInfo> = {
  hotel: { type: 'hotel', label: 'Hôtel', icon: '🏨' },
  auberge: { type: 'auberge', label: 'Auberge', icon: '🏠' },
  appartement: { type: 'appartement', label: 'Appartement', icon: '🏢' },
  maison: { type: 'maison', label: 'Maison', icon: '🏡' },
  chambre: { type: 'chambre', label: 'Chambre', icon: '🛏️' },
};

const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  courses: true,
  trajets: true,
  hebergements: true,
  promotions: true,
  messages: true,
};

interface AuthState {
  user: AuthUser | null;
  clerkId: string | null;
  supabaseProfileId: string | null;
  notificationPreferences: NotificationPreferences;
  _hasHydrated: boolean;

  setHasHydrated: (value: boolean) => void;
  setupProfile: (
    role: UserRole,
    name: string,
    email: string,
    vehicleType?: VehicleType,
    clerkId?: string,
    accommodationType?: AccommodationType
  ) => void;
  logout: () => void;
  updateProfile: (profile: Partial<UserInfo | ChauffeurProfile | HebergeurProfile>) => void;
  setDisponible: (disponible: boolean) => void;
  loadNotificationPreferences: (clerkId: string) => Promise<void>;
  setNotificationPreferences: (prefs: NotificationPreferences) => void;
}

const createClientProfile = (name: string, email: string): UserInfo => ({
  name,
  email,
  phone: '',
  address: '',
  emergencyContact: '',
  avatar: generateAvatarPlaceholder(name, 'new'),
  rating: 5.0,
  totalTrips: 0,
  totalDeliveries: 0,
  memberSince: new Date().getFullYear().toString(),
});

const createChauffeurProfile = (
  name: string,
  email: string,
  vehicleType: VehicleType = 'moto'
): ChauffeurProfile => ({
  name,
  email,
  phone: '',
  address: '',
  emergencyContact: '',
  avatar: generateAvatarPlaceholder(name, 'new'),
  rating: 5.0,
  totalTrips: 0,
  totalDeliveries: 0,
  memberSince: new Date().getFullYear().toString(),
  vehicule: VEHICLE_TYPES[vehicleType],
  disponible: true,
});

const createHebergeurProfile = (
  name: string,
  email: string,
  accommodationType: AccommodationType = 'hotel'
): HebergeurProfile => ({
  name,
  email,
  phone: '',
  address: '',
  emergencyContact: '',
  avatar: generateAvatarPlaceholder(name, 'new'),
  rating: 5.0,
  totalTrips: 0,
  totalDeliveries: 0,
  memberSince: new Date().getFullYear().toString(),
  accommodation: ACCOMMODATION_TYPES[accommodationType],
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

      setupProfile: (role, name, email, vehicleType, clerkId, accommodationType) => {
        const profile =
          role === 'chauffeur'
            ? createChauffeurProfile(name, email, vehicleType)
            : role === 'hebergeur'
            ? createHebergeurProfile(name, email, accommodationType)
            : createClientProfile(name, email);

        const newUser: AuthUser = {
          id: clerkId || Date.now().toString(),
          role,
          profile,
        };

        set({ user: newUser, clerkId: clerkId || null });

        if (role === 'chauffeur') {
          const livreur = chauffeurToLivreur(newUser);
          useDriversStore.getState().addConnectedDriver(livreur);
        }

        if (clerkId) {
          (async () => {
            try {
              const existing = await fetchProfileByClerkId(clerkId);
              if (existing) {
                set((state) => {
                  if (!state.user) return state;
                  return {
                    supabaseProfileId: existing.id,
                    user: {
                      ...state.user,
                      profile: {
                        ...state.user.profile,
                        avatar: existing.avatar || state.user.profile.avatar,
                        address: existing.address || '',
                        emergencyContact: existing.emergency_contact || '',
                        rating: existing.rating,
                        totalTrips: existing.total_trips,
                        totalDeliveries: existing.total_deliveries,
                        memberSince: new Date(existing.member_since).getFullYear().toString(),
                      },
                    },
                  };
                });
                const prefs = await fetchNotificationPreferences(clerkId);
                set({ notificationPreferences: prefs });
              } else {
                const created = await upsertProfile(clerkId, {
                  role,
                  name,
                  email,
                  disponible: role === 'chauffeur' || role === 'hebergeur',
                });
                if (created) {
                  set({ supabaseProfileId: created.id });
                }
              }
            } catch (err) {
              if (__DEV__) console.error('setupProfile sync error:', err);
            }
          })();
        }
      },

      logout: () => {
        const { user, clerkId } = get();

        if (user && user.role === 'chauffeur') {
          useDriversStore.getState().removeConnectedDriver(user.id);
        }

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

        if (clerkId) {
          const supabaseUpdates: Record<string, string | boolean> = {};
          if ('name' in updates && updates.name) supabaseUpdates.name = updates.name;
          if ('phone' in updates && updates.phone) supabaseUpdates.phone = updates.phone;
          if ('avatar' in updates && updates.avatar) supabaseUpdates.avatar = updates.avatar;
          if ('address' in updates && updates.address !== undefined) supabaseUpdates.address = updates.address;
          if ('emergencyContact' in updates && updates.emergencyContact !== undefined) supabaseUpdates.emergency_contact = updates.emergencyContact;
          if (Object.keys(supabaseUpdates).length > 0) {
            updateSupabaseProfile(clerkId, supabaseUpdates);
          }
        }
      },

      setDisponible: (disponible) => {
        const { user, clerkId } = get();
        if (!user || (user.role !== 'chauffeur' && user.role !== 'hebergeur')) return;

        if (user.role === 'chauffeur') {
          set({
            user: {
              ...user,
              profile: { ...(user.profile as ChauffeurProfile), disponible },
            },
          });
          useDriversStore.getState().updateDriverAvailability(user.id, disponible);
        } else if (user.role === 'hebergeur') {
          set({
            user: {
              ...user,
              profile: { ...(user.profile as HebergeurProfile), disponible },
            },
          });
        }

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

export const isChauffeur = (
  user: AuthUser | null
): user is AuthUser & { profile: ChauffeurProfile } => {
  return user?.role === 'chauffeur';
};

export const isHebergeur = (
  user: AuthUser | null
): user is AuthUser & { profile: HebergeurProfile } => {
  return user?.role === 'hebergeur';
};

export const chauffeurToLivreur = (user: AuthUser): Livreur => {
  const profile = user.profile as ChauffeurProfile;
  return {
    id: user.id,
    prenom: profile.name.split(' ')[0],
    vehicule: `${profile.vehicule.icon} ${profile.vehicule.label}`,
    etoiles: profile.rating,
    disponible: profile.disponible,
    photo: profile.avatar,
    commentaires: ['Nouveau chauffeur', 'Inscrit récemment'],
    distance: Math.random() * 3 + 0.5,
  };
};
