import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AuthUser,
  UserRole,
  ChauffeurProfile,
  HebergeurProfile,
  AgencyProfile,
  UserInfo,
  VehicleType,
  VehicleInfo,
  AccommodationType,
  AccommodationInfo,
  Livreur,
  NotificationPreferences,
} from '../types';
import { useDriversStore } from './driversStore';
import { useFavoritesStore } from './favoritesStore';
import {
  upsertProfile,
  fetchProfileByClerkId,
  updateProfile as updateSupabaseProfile,
  getEffectiveRoles,
  buildDefaultRoles,
} from '../lib/supabaseProfile';
import { fetchNotificationPreferences, updateNotificationPreferences, updatePushToken } from '../lib/supabaseNotifications';
import { generateAvatarPlaceholder } from '../lib/supabaseAvatar';

export const VEHICLE_TYPES: Record<VehicleType, VehicleInfo> = {
  velo: { type: 'velo', label: 'Vélo', icon: '🚲' },
  moto: { type: 'moto', label: 'Moto', icon: '🏍️' },
  taxi: { type: 'taxi', label: 'Taxi', icon: '🚕' },
  voiture: { type: 'voiture', label: 'Voiture', icon: '🚙' },
  // Kept for legacy DB rows only — not surfaced in any picker.
  camionnette: { type: 'camionnette', label: 'Camionnette', icon: '🚚' },
  bus: { type: 'bus', label: 'Bus', icon: '🚌' },
  train: { type: 'train', label: 'Train', icon: '🚆' },
  avion: { type: 'avion', label: 'Avion', icon: '✈️' },
  bateau: { type: 'bateau', label: 'Bateaux', icon: '🚢' },
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
  /**
   * Switch the active role *without re-authenticating*. The new role must
   * already be in `user.roles[]` (multi-role MVP — migration 023). Returns
   * true on success, false if the user is null or the role is not granted.
   *
   * Local state is updated synchronously so the tab bar / home re-render
   * immediately. Supabase persistence is fire-and-forget (errors logged).
   * Clerk metadata persistence is the caller's job — see the sheet handlers
   * in HomeHeader / settings-screen.
   */
  switchRole: (newRole: UserRole) => boolean;
  /**
   * Promote the current user to role='agence' by claiming an invitation code.
   * Calls the SECURITY DEFINER `claim_agency_code` RPC server-side, which
   * atomically marks the code as used and updates the profiles row. On
   * success, mirrors the new role + agency fields into local state and
   * appends 'agence' to the user's roles[] array.
   *
   * Returns the raw ClaimResult so the caller (auth screen) can show a
   * descriptive error if the code is invalid/used/expired. Requires
   * `supabaseProfileId` to be set — the caller must wait for the initial
   * profile sync from `setupProfile` to complete before invoking this.
   */
  promoteToAgence: (code: string) => Promise<import('../lib/supabaseAgencyInvitations').ClaimResult>;
  /**
   * Retente la synchronisation du profil Supabase quand `supabaseProfileId`
   * est resté null (première sync échouée — réseau, ou requête partie avant
   * l'injection du JWT Clerk — puis persistée telle quelle). Sans ça le
   * compte reste bloqué : toutes les réservations affichent "profil pas
   * encore synchronisé". No-op si déjà synchronisé ou pas de session.
   */
  resyncSupabaseProfile: () => Promise<void>;
  logout: () => void;
  updateProfile: (profile: Partial<UserInfo | ChauffeurProfile | HebergeurProfile | AgencyProfile>) => void;
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
  vehicleType: VehicleType = 'voiture'
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

type AnyProfile = UserInfo | ChauffeurProfile | HebergeurProfile | AgencyProfile;

// A multi-role user keeps a single profile object and switches the active
// role at runtime (switchRole) — but switching never reshapes the profile.
// So a user who started as client and switched to hebergeur would carry a
// profile WITHOUT `accommodation`, and the UI/type-guards (which trust the
// role) would crash on `accommodation.icon`. This guarantees the role-specific
// fields exist with sane defaults. Existing values are never overwritten.
export const ensureRoleProfileShape = (profile: AnyProfile, role: UserRole): AnyProfile => {
  if ((role === 'chauffeur' || role === 'agence') && !(profile as ChauffeurProfile).vehicule) {
    return {
      ...profile,
      vehicule: VEHICLE_TYPES.voiture,
      disponible: (profile as ChauffeurProfile).disponible ?? true,
    } as ChauffeurProfile;
  }
  if (role === 'hebergeur' && !(profile as HebergeurProfile).accommodation) {
    return {
      ...profile,
      accommodation: ACCOMMODATION_TYPES.hotel,
      disponible: (profile as HebergeurProfile).disponible ?? true,
    } as HebergeurProfile;
  }
  return profile;
};

type AuthStateSetter = (
  partial: Partial<AuthState> | ((state: AuthState) => Partial<AuthState> | AuthState)
) => void;

// Fetch-or-create de la ligne `profiles` côté Supabase. Extrait de
// setupProfile pour pouvoir être rejoué par resyncSupabaseProfile quand la
// première tentative a échoué. Le verrou évite les doublons quand le layout
// protégé relance une sync pendant que celle de setupProfile est en vol.
let profileSyncInFlight = false;
const syncSupabaseProfileRow = async (
  clerkId: string,
  fallback: { role: UserRole; name: string; email: string },
  set: AuthStateSetter
): Promise<void> => {
  if (profileSyncInFlight) return;
  profileSyncInFlight = true;
  try {
    const existing = await fetchProfileByClerkId(clerkId);
    if (existing) {
      const effectiveRoles = getEffectiveRoles(existing);
      set((state) => {
        if (!state.user) return state;
        // If the server says role='agence' (e.g. the user claimed
        // an invitation code on a previous session), trust the DB
        // over the optimistic local role from this setupProfile
        // call. Also surface agency_name / agency_logo_url so the
        // tab bar + voyage cards render the agency identity.
        const serverRole = existing.role === 'agence' ? 'agence' : state.user.role;
        const baseProfile = {
          ...state.user.profile,
          avatar: existing.avatar || state.user.profile.avatar,
          address: existing.address || '',
          emergencyContact: existing.emergency_contact || '',
          rating: existing.rating,
          totalTrips: existing.total_trips,
          totalDeliveries: existing.total_deliveries,
          memberSince: new Date(existing.member_since).getFullYear().toString(),
        };
        const nextProfile =
          existing.role === 'agence'
            ? {
                ...baseProfile,
                agencyName: existing.agency_name ?? '',
                agencyLogoUrl: existing.agency_logo_url ?? null,
              }
            : baseProfile;
        return {
          supabaseProfileId: existing.id,
          user: {
            ...state.user,
            role: serverRole,
            roles: effectiveRoles.length > 0 ? effectiveRoles : state.user.roles,
            profile: nextProfile as typeof state.user.profile,
          },
        };
      });
      const prefs = await fetchNotificationPreferences(clerkId);
      set({ notificationPreferences: prefs });
    } else {
      const created = await upsertProfile(clerkId, {
        role: fallback.role,
        name: fallback.name,
        email: fallback.email,
        disponible: fallback.role === 'chauffeur' || fallback.role === 'hebergeur',
        roles: buildDefaultRoles(fallback.role),
      });
      if (created) {
        const effectiveRoles = getEffectiveRoles(created);
        set((state) => ({
          supabaseProfileId: created.id,
          user: state.user
            ? {
                ...state.user,
                roles: effectiveRoles.length > 0 ? effectiveRoles : state.user.roles,
              }
            : state.user,
        }));
      }
    }
  } catch (err) {
    if (__DEV__) console.error('setupProfile sync error:', err);
  } finally {
    profileSyncInFlight = false;
  }
};

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
          // Optimistic default — the Supabase fetch below will replace
          // this with the authoritative roles[] from the row.
          roles: buildDefaultRoles(role),
          profile,
        };

        set({ user: newUser, clerkId: clerkId || null });

        if (role === 'chauffeur') {
          const livreur = chauffeurToLivreur(newUser);
          useDriversStore.getState().addConnectedDriver(livreur);
        }

        if (clerkId) {
          void syncSupabaseProfileRow(clerkId, { role, name, email }, set);
        }
      },

      resyncSupabaseProfile: async () => {
        const { user, clerkId, supabaseProfileId } = get();
        if (!clerkId || !user || supabaseProfileId) return;
        await syncSupabaseProfileRow(
          clerkId,
          { role: user.role, name: user.profile.name, email: user.profile.email },
          set
        );
      },

      switchRole: (newRole) => {
        const { user, clerkId } = get();
        if (!user) return false;

        const granted = user.roles && user.roles.length > 0 ? user.roles : [user.role];
        if (!granted.includes(newRole)) return false;
        if (user.role === newRole) return true;

        set({
          user: {
            ...user,
            role: newRole,
            profile: ensureRoleProfileShape(user.profile, newRole),
          },
        });

        // If the user was a chauffeur driving for the previous role and we
        // switch away, drop them from the connected-drivers list so they
        // stop appearing as available. Re-adding when switching *to*
        // chauffeur is handled by the screens that need it (no static
        // demo livreur synthesis).
        if (user.role === 'chauffeur' && newRole !== 'chauffeur') {
          useDriversStore.getState().removeConnectedDriver(user.id);
        }

        if (clerkId) {
          updateSupabaseProfile(clerkId, { role: newRole });
        }
        return true;
      },

      promoteToAgence: async (code) => {
        const { user, supabaseProfileId } = get();
        const { claimAgencyCode } = await import('../lib/supabaseAgencyInvitations');

        if (!user || !supabaseProfileId) {
          return {
            ok: false,
            reason: 'profile_missing',
            message: 'Compte non encore synchronisé. Réessaie dans un instant.',
          };
        }

        const result = await claimAgencyCode(code, supabaseProfileId);
        if (!result.ok) return result;

        // Mirror the server-side promotion into local state so the UI
        // (tabs, role pill, trajet form) reflects 'agence' immediately
        // without waiting for the next profile refetch.
        set((state) => {
          if (!state.user) return state;
          const nextRoles = Array.from(
            new Set([...(state.user.roles ?? []), 'agence' as UserRole])
          );
          // An agence publishes trajets, so its profile needs `vehicule` —
          // a hôte/client promoted to agence wouldn't have one. Normalise
          // first, then graft the agency identity on top.
          const shaped = ensureRoleProfileShape(state.user.profile, 'agence');
          return {
            user: {
              ...state.user,
              role: 'agence',
              roles: nextRoles,
              profile: {
                ...shaped,
                agencyName: result.agencyName,
                agencyLogoUrl: null,
              } as AgencyProfile,
            },
          };
        });

        return result;
      },

      logout: () => {
        const { user, clerkId } = get();

        if (user && user.role === 'chauffeur') {
          useDriversStore.getState().removeConnectedDriver(user.id);
        }

        // Clear per-user favourites so the next account doesn't inherit the
        // previous user's hearts (and can't toggle against the old clientId).
        useFavoritesStore.getState().reset();

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
        // Repair profiles persisted before role-shape normalisation existed:
        // a user who switched to hebergeur/chauffeur kept a profile missing
        // `accommodation`/`vehicule`, which crashes the profil screen.
        if (state?.user) {
          const repaired = ensureRoleProfileShape(state.user.profile, state.user.role);
          if (repaired !== state.user.profile) {
            state.user = { ...state.user, profile: repaired };
          }
        }
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

export const isAgence = (
  user: AuthUser | null
): user is AuthUser & { profile: AgencyProfile } => {
  return user?.role === 'agence';
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
    commentaires: ['Nouveau transporteur', 'Inscrit récemment'],
    distance: Math.random() * 3 + 0.5,
  };
};
