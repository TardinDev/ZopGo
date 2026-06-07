import {
  useAuthStore,
  isChauffeur,
  isHebergeur,
  chauffeurToLivreur,
  ensureRoleProfileShape,
  VEHICLE_TYPES,
  ACCOMMODATION_TYPES,
} from '../authStore';
import { useDriversStore } from '../driversStore';
import { useFavoritesStore } from '../favoritesStore';
import { fetchProfileByClerkId, upsertProfile, updateProfile as updateSupabaseProfile } from '../../lib/supabaseProfile';
import { updatePushToken, fetchNotificationPreferences, updateNotificationPreferences } from '../../lib/supabaseNotifications';
import type { AuthUser, ChauffeurProfile, HebergeurProfile } from '../../types';

beforeEach(() => {
  jest.clearAllMocks();
  // Reset stores
  useAuthStore.setState({
    user: null,
    clerkId: null,
    supabaseProfileId: null,
    notificationPreferences: { courses: true, trajets: true, hebergements: true, promotions: true, messages: true },
    _hasHydrated: false,
  });
  useDriversStore.setState({
    connectedDrivers: [],
    isLoading: false,
  });
});

// ─── ensureRoleProfileShape ─────────────────────────────────────────

describe('ensureRoleProfileShape', () => {
  const bareProfile = {
    name: 'X',
    email: 'x@test.com',
    phone: '',
    address: '',
    emergencyContact: '',
    avatar: '',
    rating: 5,
    totalTrips: 0,
    totalDeliveries: 0,
    memberSince: '2026',
  } as unknown as AuthUser['profile'];

  it('adds a default accommodation for a hebergeur profile that lacks one', () => {
    const out = ensureRoleProfileShape(bareProfile, 'hebergeur') as HebergeurProfile;
    expect(out.accommodation.type).toBe('hotel');
  });

  it('adds a default vehicule for a chauffeur profile that lacks one', () => {
    const out = ensureRoleProfileShape(bareProfile, 'chauffeur') as ChauffeurProfile;
    expect(out.vehicule.type).toBe('voiture');
  });

  it('adds a default vehicule for an agence profile (agence publishes trajets)', () => {
    const out = ensureRoleProfileShape(bareProfile, 'agence') as ChauffeurProfile;
    expect(out.vehicule.type).toBe('voiture');
  });

  it('returns the SAME reference when nothing needs repair (client / already shaped)', () => {
    expect(ensureRoleProfileShape(bareProfile, 'client')).toBe(bareProfile);
    const hebergeur = { ...bareProfile, accommodation: ACCOMMODATION_TYPES.maison } as AuthUser['profile'];
    expect(ensureRoleProfileShape(hebergeur, 'hebergeur')).toBe(hebergeur);
  });
});

// ─── setupProfile ───────────────────────────────────────────────────

describe('setupProfile', () => {
  it('creates client profile', () => {
    useAuthStore.getState().setupProfile('client', 'Jean Dupont', 'jean@test.com');
    const state = useAuthStore.getState();
    expect(state.user).not.toBeNull();
    expect(state.user!.role).toBe('client');
    expect(state.user!.profile.name).toBe('Jean Dupont');
    expect(state.user!.profile.email).toBe('jean@test.com');
  });

  it('creates chauffeur profile with vehicle', () => {
    useAuthStore.getState().setupProfile('chauffeur', 'Pierre', 'pierre@test.com', 'voiture');
    const state = useAuthStore.getState();
    expect(state.user!.role).toBe('chauffeur');
    const profile = state.user!.profile as ChauffeurProfile;
    expect(profile.vehicule.type).toBe('voiture');
    expect(profile.disponible).toBe(true);
  });

  it('creates chauffeur profile with default vehicle (voiture)', () => {
    useAuthStore.getState().setupProfile('chauffeur', 'Pierre', 'pierre@test.com');
    const profile = useAuthStore.getState().user!.profile as ChauffeurProfile;
    expect(profile.vehicule.type).toBe('voiture');
  });

  it('accepts bus as chauffeur vehicle type', () => {
    useAuthStore.getState().setupProfile('chauffeur', 'Sam', 'sam@test.com', 'bus');
    const profile = useAuthStore.getState().user!.profile as ChauffeurProfile;
    expect(profile.vehicule.type).toBe('bus');
    expect(profile.vehicule.label).toBe('Bus');
    expect(profile.vehicule.icon).toBe('🚌');
  });

  it('creates hebergeur profile with accommodation', () => {
    useAuthStore
      .getState()
      .setupProfile('hebergeur', 'Marie', 'marie@test.com', undefined, undefined, 'appartement');
    const state = useAuthStore.getState();
    expect(state.user!.role).toBe('hebergeur');
    const profile = state.user!.profile as HebergeurProfile;
    expect(profile.accommodation.type).toBe('appartement');
    expect(profile.disponible).toBe(true);
  });

  it('creates hebergeur profile with default accommodation (hotel)', () => {
    useAuthStore.getState().setupProfile('hebergeur', 'Marie', 'marie@test.com');
    const profile = useAuthStore.getState().user!.profile as HebergeurProfile;
    expect(profile.accommodation.type).toBe('hotel');
  });

  it('sets clerkId when provided', () => {
    useAuthStore.getState().setupProfile('client', 'Jean', 'jean@test.com', undefined, 'clerk_123');
    expect(useAuthStore.getState().clerkId).toBe('clerk_123');
  });

  it('generates id from Date.now() when no clerkId', () => {
    useAuthStore.getState().setupProfile('client', 'Jean', 'jean@test.com');
    expect(useAuthStore.getState().user!.id).toBeTruthy();
    expect(useAuthStore.getState().clerkId).toBeNull();
  });

  it('adds chauffeur to driversStore', () => {
    useAuthStore.getState().setupProfile('chauffeur', 'Pierre', 'pierre@test.com', 'moto');
    const drivers = useDriversStore.getState().connectedDrivers;
    expect(drivers).toHaveLength(1);
    expect(drivers[0].prenom).toBe('Pierre');
  });

  it('does not add client to driversStore', () => {
    useAuthStore.getState().setupProfile('client', 'Jean', 'jean@test.com');
    expect(useDriversStore.getState().connectedDrivers).toHaveLength(0);
  });

  it('initializes default profile fields', () => {
    useAuthStore.getState().setupProfile('client', 'Jean', 'jean@test.com');
    const profile = useAuthStore.getState().user!.profile;
    expect(profile.rating).toBe(5.0);
    expect(profile.totalTrips).toBe(0);
    expect(profile.totalDeliveries).toBe(0);
    expect(profile.phone).toBe('');
  });

  it('fetches existing profile from Supabase when clerkId provided', async () => {
    (fetchProfileByClerkId as jest.Mock).mockResolvedValue({
      id: 'supa_1',
      rating: 4.2,
      total_trips: 10,
      total_deliveries: 5,
      member_since: '2025-01-01',
    });

    useAuthStore.getState().setupProfile('client', 'Jean', 'jean@test.com', undefined, 'clerk_123');

    // Wait for async IIFE to complete
    await new Promise((r) => setTimeout(r, 50));

    const state = useAuthStore.getState();
    expect(state.supabaseProfileId).toBe('supa_1');
    expect(state.user!.profile.rating).toBe(4.2);
    expect(state.user!.profile.totalTrips).toBe(10);
  });

  it('creates new profile in Supabase when not existing', async () => {
    (fetchProfileByClerkId as jest.Mock).mockResolvedValue(null);
    (upsertProfile as jest.Mock).mockResolvedValue({ id: 'new_supa_1' });

    useAuthStore.getState().setupProfile('client', 'Jean', 'jean@test.com', undefined, 'clerk_123');

    await new Promise((r) => setTimeout(r, 50));

    expect(upsertProfile).toHaveBeenCalledWith('clerk_123', expect.objectContaining({
      role: 'client',
      name: 'Jean',
      email: 'jean@test.com',
    }));
    expect(useAuthStore.getState().supabaseProfileId).toBe('new_supa_1');
  });

  // ─── Multi-role (migration 023 + 024 — all roles for everyone) ─────

  it('sets optimistic roles=[all three] for a client before Supabase sync', () => {
    useAuthStore.getState().setupProfile('client', 'Jean', 'jean@test.com');
    expect(useAuthStore.getState().user!.roles).toEqual([
      'client',
      'chauffeur',
      'hebergeur',
    ]);
  });

  it('sets optimistic roles=[all three] for a chauffeur before Supabase sync', () => {
    useAuthStore.getState().setupProfile('chauffeur', 'Pierre', 'pierre@test.com', 'moto');
    expect(useAuthStore.getState().user!.roles).toEqual([
      'client',
      'chauffeur',
      'hebergeur',
    ]);
  });

  it('sets optimistic roles=[all three] for a hebergeur before Supabase sync', () => {
    useAuthStore.getState().setupProfile('hebergeur', 'Marie', 'marie@test.com');
    expect(useAuthStore.getState().user!.roles).toEqual([
      'client',
      'chauffeur',
      'hebergeur',
    ]);
  });

  it('replaces optimistic roles with the authoritative roles[] from Supabase', async () => {
    (fetchProfileByClerkId as jest.Mock).mockResolvedValue({
      id: 'supa_1',
      role: 'chauffeur',
      roles: ['client', 'chauffeur', 'hebergeur'],
      rating: 4.2,
      total_trips: 10,
      total_deliveries: 5,
      member_since: '2025-01-01',
    });

    useAuthStore
      .getState()
      .setupProfile('chauffeur', 'Pierre', 'p@test.com', 'moto', 'clerk_456');

    await new Promise((r) => setTimeout(r, 50));

    expect(useAuthStore.getState().user!.roles).toEqual([
      'client',
      'chauffeur',
      'hebergeur',
    ]);
  });

  it('falls back to [role] when fetched profile has roles=null (pre-migration row)', async () => {
    (fetchProfileByClerkId as jest.Mock).mockResolvedValue({
      id: 'supa_2',
      role: 'chauffeur',
      roles: null,
      rating: 5,
      total_trips: 0,
      total_deliveries: 0,
      member_since: '2025-01-01',
    });

    useAuthStore
      .getState()
      .setupProfile('chauffeur', 'P', 'p@test.com', 'moto', 'clerk_789');

    await new Promise((r) => setTimeout(r, 50));

    expect(useAuthStore.getState().user!.roles).toEqual(['chauffeur']);
  });

  it('passes roles=[all three] to upsertProfile when creating a new profile', async () => {
    (fetchProfileByClerkId as jest.Mock).mockResolvedValue(null);
    (upsertProfile as jest.Mock).mockResolvedValue({
      id: 'new_supa_2',
      role: 'chauffeur',
      roles: ['client', 'chauffeur', 'hebergeur'],
    });

    useAuthStore
      .getState()
      .setupProfile('chauffeur', 'Pierre', 'p@test.com', 'moto', 'clerk_999');

    await new Promise((r) => setTimeout(r, 50));

    expect(upsertProfile).toHaveBeenCalledWith(
      'clerk_999',
      expect.objectContaining({
        roles: ['client', 'chauffeur', 'hebergeur'],
      })
    );
    expect(useAuthStore.getState().user!.roles).toEqual([
      'client',
      'chauffeur',
      'hebergeur',
    ]);
  });
});

// ─── switchRole ─────────────────────────────────────────────────────

describe('switchRole', () => {
  function seedMultiRoleUser(roles: AuthUser['roles'], current: AuthUser['role'] = 'client') {
    useAuthStore.setState({
      user: {
        id: 'user-1',
        role: current,
        roles,
        profile: {
          name: 'Pierre',
          email: 'p@test.com',
          phone: '',
          address: '',
          emergencyContact: '',
          avatar: '',
          rating: 5,
          totalTrips: 0,
          totalDeliveries: 0,
          memberSince: '2026',
        },
      },
      clerkId: 'clerk-abc',
      supabaseProfileId: 'profile-1',
    });
  }

  it('returns false when no user is signed in', () => {
    const ok = useAuthStore.getState().switchRole('chauffeur');
    expect(ok).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('returns false when the requested role is not granted', () => {
    seedMultiRoleUser(['client'], 'client');
    const ok = useAuthStore.getState().switchRole('chauffeur');
    expect(ok).toBe(false);
    expect(useAuthStore.getState().user!.role).toBe('client');
    expect(updateSupabaseProfile).not.toHaveBeenCalled();
  });

  it('returns true and is a no-op when switching to the current role', () => {
    seedMultiRoleUser(['client', 'chauffeur'], 'chauffeur');
    const ok = useAuthStore.getState().switchRole('chauffeur');
    expect(ok).toBe(true);
    expect(useAuthStore.getState().user!.role).toBe('chauffeur');
    expect(updateSupabaseProfile).not.toHaveBeenCalled();
  });

  it('switches the active role locally and persists to Supabase', () => {
    seedMultiRoleUser(['client', 'chauffeur'], 'client');
    const ok = useAuthStore.getState().switchRole('chauffeur');
    expect(ok).toBe(true);
    expect(useAuthStore.getState().user!.role).toBe('chauffeur');
    expect(updateSupabaseProfile).toHaveBeenCalledWith('clerk-abc', { role: 'chauffeur' });
  });

  it('populates accommodation when switching to hebergeur from a profile that lacks it', () => {
    seedMultiRoleUser(['client', 'hebergeur'], 'client');
    const ok = useAuthStore.getState().switchRole('hebergeur');
    expect(ok).toBe(true);
    const profile = useAuthStore.getState().user!.profile as HebergeurProfile;
    expect(profile.accommodation).toBeDefined();
    expect(profile.accommodation.type).toBe('hotel');
    expect(profile.accommodation.icon).toBeTruthy();
    expect(profile.accommodation.label).toBeTruthy();
  });

  it('populates vehicule when switching to chauffeur from a profile that lacks it', () => {
    seedMultiRoleUser(['client', 'chauffeur'], 'client');
    const ok = useAuthStore.getState().switchRole('chauffeur');
    expect(ok).toBe(true);
    const profile = useAuthStore.getState().user!.profile as ChauffeurProfile;
    expect(profile.vehicule).toBeDefined();
    expect(profile.vehicule.type).toBe('voiture');
    expect(profile.vehicule.icon).toBeTruthy();
  });

  it('preserves an existing accommodation when switching to hebergeur', () => {
    useAuthStore.setState({
      user: {
        id: 'user-2',
        role: 'client',
        roles: ['client', 'hebergeur'],
        profile: {
          name: 'Awa',
          email: 'awa@test.com',
          phone: '',
          address: '',
          emergencyContact: '',
          avatar: '',
          rating: 5,
          totalTrips: 0,
          totalDeliveries: 0,
          memberSince: '2026',
          accommodation: { type: 'maison', label: 'Maison', icon: '🏡' },
          disponible: true,
        } as unknown as AuthUser['profile'],
      },
      clerkId: 'clerk-xyz',
      supabaseProfileId: 'profile-2',
    });
    useAuthStore.getState().switchRole('hebergeur');
    const profile = useAuthStore.getState().user!.profile as HebergeurProfile;
    expect(profile.accommodation.type).toBe('maison');
  });

  it('falls back to [user.role] when roles[] is missing (pre-migration profile)', () => {
    useAuthStore.setState({
      user: {
        id: 'legacy-1',
        role: 'chauffeur',
        // roles intentionally absent — legacy persisted profile
        profile: {
          name: 'Old User',
          email: 'old@test.com',
          phone: '',
          address: '',
          emergencyContact: '',
          avatar: '',
          rating: 5,
          totalTrips: 0,
          totalDeliveries: 0,
          memberSince: '2025',
        },
      },
      clerkId: 'clerk-old',
      supabaseProfileId: 'profile-old',
    });

    // Switching to a role not in the fallback set must fail.
    expect(useAuthStore.getState().switchRole('client')).toBe(false);
    expect(useAuthStore.getState().user!.role).toBe('chauffeur');
    // Switching to the *fallback* current role is a no-op (truthy).
    expect(useAuthStore.getState().switchRole('chauffeur')).toBe(true);
  });

  it('removes the chauffeur from driversStore when switching AWAY from chauffeur', () => {
    seedMultiRoleUser(['client', 'chauffeur'], 'chauffeur');
    useDriversStore.setState({
      connectedDrivers: [
        {
          id: 'user-1',
          prenom: 'Pierre',
          vehicule: '🚗 Voiture',
          etoiles: 5,
          disponible: true,
          photo: '',
          commentaires: [],
          distance: 0,
        },
      ],
      isLoading: false,
    });

    useAuthStore.getState().switchRole('client');

    expect(useDriversStore.getState().connectedDrivers).toHaveLength(0);
  });

  it('does not touch driversStore when switching between non-chauffeur roles', () => {
    seedMultiRoleUser(['client', 'hebergeur'], 'client');
    const before = useDriversStore.getState().connectedDrivers;
    useAuthStore.getState().switchRole('hebergeur');
    expect(useDriversStore.getState().connectedDrivers).toEqual(before);
  });
});

// ─── logout ─────────────────────────────────────────────────────────

describe('logout', () => {
  it('clears user state', () => {
    useAuthStore.getState().setupProfile('client', 'Jean', 'jean@test.com', undefined, 'clerk_1');
    useAuthStore.getState().logout();
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.clerkId).toBeNull();
    expect(state.supabaseProfileId).toBeNull();
  });

  it('removes chauffeur from driversStore on logout', () => {
    useAuthStore.getState().setupProfile('chauffeur', 'Pierre', 'pierre@test.com', 'moto', 'clerk_2');
    expect(useDriversStore.getState().connectedDrivers).toHaveLength(1);
    useAuthStore.getState().logout();
    expect(useDriversStore.getState().connectedDrivers).toHaveLength(0);
  });

  it('clears the favourites store on logout', () => {
    useFavoritesStore.setState({ clientId: 'c1', favoriteIds: ['h1'], favorites: [] });
    useAuthStore.getState().setupProfile('client', 'Jean', 'jean@test.com', undefined, 'clerk_1');
    useAuthStore.getState().logout();
    expect(useFavoritesStore.getState().clientId).toBeNull();
    expect(useFavoritesStore.getState().favoriteIds).toEqual([]);
  });

  it('clears push token in Supabase on logout', () => {
    useAuthStore.getState().setupProfile('client', 'Jean', 'jean@test.com', undefined, 'clerk_1');
    jest.clearAllMocks();
    useAuthStore.getState().logout();
    expect(updatePushToken).toHaveBeenCalledWith('clerk_1', null);
  });

  it('resets notification preferences to defaults', () => {
    useAuthStore.setState({
      notificationPreferences: { courses: false, trajets: false, hebergements: false, promotions: false, messages: false },
    });
    useAuthStore.getState().logout();
    const prefs = useAuthStore.getState().notificationPreferences;
    expect(prefs.courses).toBe(true);
    expect(prefs.trajets).toBe(true);
  });
});

// ─── updateProfile ──────────────────────────────────────────────────

describe('updateProfile', () => {
  it('updates profile fields', () => {
    useAuthStore.getState().setupProfile('client', 'Jean', 'jean@test.com');
    useAuthStore.getState().updateProfile({ name: 'Jean Updated', phone: '+24107123456' });
    const profile = useAuthStore.getState().user!.profile;
    expect(profile.name).toBe('Jean Updated');
    expect(profile.phone).toBe('+24107123456');
  });

  it('does nothing if no user', () => {
    useAuthStore.getState().updateProfile({ name: 'Nobody' });
    expect(useAuthStore.getState().user).toBeNull();
  });
});

// ─── setDisponible ──────────────────────────────────────────────────

describe('setDisponible', () => {
  it('updates chauffeur availability', () => {
    useAuthStore.getState().setupProfile('chauffeur', 'Pierre', 'pierre@test.com', 'moto');
    useAuthStore.getState().setDisponible(false);
    const profile = useAuthStore.getState().user!.profile as ChauffeurProfile;
    expect(profile.disponible).toBe(false);
  });

  it('updates hebergeur availability', () => {
    useAuthStore.getState().setupProfile('hebergeur', 'Marie', 'marie@test.com');
    useAuthStore.getState().setDisponible(false);
    const profile = useAuthStore.getState().user!.profile as HebergeurProfile;
    expect(profile.disponible).toBe(false);
  });

  it('does nothing for client role', () => {
    useAuthStore.getState().setupProfile('client', 'Jean', 'jean@test.com');
    useAuthStore.getState().setDisponible(false);
    // Client profile doesn't have disponible - just ensure no crash
    expect(useAuthStore.getState().user!.role).toBe('client');
  });

  it('updates driversStore for chauffeur', () => {
    useAuthStore.getState().setupProfile('chauffeur', 'Pierre', 'pierre@test.com', 'moto');
    useAuthStore.getState().setDisponible(false);
    const drivers = useDriversStore.getState().connectedDrivers;
    expect(drivers[0].disponible).toBe(false);
  });
});

// ─── setHasHydrated ─────────────────────────────────────────────────

describe('setHasHydrated', () => {
  it('sets hydration flag', () => {
    useAuthStore.getState().setHasHydrated(true);
    expect(useAuthStore.getState()._hasHydrated).toBe(true);
  });
});

// ─── loadNotificationPreferences ────────────────────────────────────

describe('loadNotificationPreferences', () => {
  it('loads prefs from Supabase', async () => {
    const mockPrefs = { courses: false, trajets: true, hebergements: false, promotions: true };
    (fetchNotificationPreferences as jest.Mock).mockResolvedValue(mockPrefs);
    await useAuthStore.getState().loadNotificationPreferences('clerk_1');
    expect(useAuthStore.getState().notificationPreferences).toEqual(mockPrefs);
  });
});

// ─── setNotificationPreferences ─────────────────────────────────────

describe('setNotificationPreferences', () => {
  it('updates prefs locally and syncs to Supabase', () => {
    useAuthStore.setState({ clerkId: 'clerk_1' });
    const prefs = { courses: false, trajets: false, hebergements: true, promotions: true, messages: true };
    useAuthStore.getState().setNotificationPreferences(prefs);
    expect(useAuthStore.getState().notificationPreferences).toEqual(prefs);
    expect(updateNotificationPreferences).toHaveBeenCalledWith('clerk_1', prefs);
  });

  it('does not sync to Supabase when no clerkId', () => {
    const prefs = { courses: false, trajets: false, hebergements: true, promotions: true, messages: true };
    useAuthStore.getState().setNotificationPreferences(prefs);
    expect(updateNotificationPreferences).not.toHaveBeenCalled();
  });
});

// ─── Helper functions ───────────────────────────────────────────────

describe('isChauffeur', () => {
  it('returns true for chauffeur user', () => {
    useAuthStore.getState().setupProfile('chauffeur', 'Pierre', 'p@test.com', 'moto');
    expect(isChauffeur(useAuthStore.getState().user)).toBe(true);
  });

  it('returns false for client user', () => {
    useAuthStore.getState().setupProfile('client', 'Jean', 'j@test.com');
    expect(isChauffeur(useAuthStore.getState().user)).toBe(false);
  });

  it('returns false for null', () => {
    expect(isChauffeur(null)).toBe(false);
  });
});

describe('isHebergeur', () => {
  it('returns true for hebergeur user', () => {
    useAuthStore.getState().setupProfile('hebergeur', 'Marie', 'm@test.com');
    expect(isHebergeur(useAuthStore.getState().user)).toBe(true);
  });

  it('returns false for client user', () => {
    useAuthStore.getState().setupProfile('client', 'Jean', 'j@test.com');
    expect(isHebergeur(useAuthStore.getState().user)).toBe(false);
  });
});

describe('chauffeurToLivreur', () => {
  it('converts chauffeur AuthUser to Livreur', () => {
    useAuthStore.getState().setupProfile('chauffeur', 'Pierre Martin', 'p@test.com', 'voiture');
    const user = useAuthStore.getState().user!;
    const livreur = chauffeurToLivreur(user);
    expect(livreur.id).toBe(user.id);
    expect(livreur.prenom).toBe('Pierre');
    expect(livreur.vehicule).toContain('Voiture');
    expect(livreur.etoiles).toBe(5.0);
    expect(livreur.disponible).toBe(true);
  });
});

describe('VEHICLE_TYPES', () => {
  it('has all vehicle types', () => {
    // Order matters here — auth.tsx renders the picker via Object.values()
    // and the order drives display order in signup.
    expect(Object.keys(VEHICLE_TYPES)).toEqual([
      'velo',
      'moto',
      'taxi',
      'voiture',
      'camionnette',
      'bus',
      'train',
      'avion',
      'bateau',
    ]);
  });

  it('exposes Bus with the right icon', () => {
    expect(VEHICLE_TYPES.bus).toEqual({ type: 'bus', label: 'Bus', icon: '🚌' });
  });

  it('exposes the new transport modes (taxi, train, avion, bateau)', () => {
    expect(VEHICLE_TYPES.taxi).toEqual({ type: 'taxi', label: 'Taxi', icon: '🚕' });
    expect(VEHICLE_TYPES.train).toEqual({ type: 'train', label: 'Train', icon: '🚆' });
    expect(VEHICLE_TYPES.avion).toEqual({ type: 'avion', label: 'Avion', icon: '✈️' });
    expect(VEHICLE_TYPES.bateau).toEqual({ type: 'bateau', label: 'Bateaux', icon: '🚢' });
  });

  it('still exposes moto (kept for livraisons + legacy chauffeur profiles)', () => {
    expect(VEHICLE_TYPES.moto.type).toBe('moto');
  });

  it('still exposes camionnette for legacy DB rows even though it is no longer offered', () => {
    expect(VEHICLE_TYPES.camionnette.type).toBe('camionnette');
  });
});

describe('ACCOMMODATION_TYPES', () => {
  it('has all accommodation types', () => {
    expect(Object.keys(ACCOMMODATION_TYPES)).toEqual([
      'hotel',
      'auberge',
      'appartement',
      'maison',
      'chambre',
    ]);
  });
});
