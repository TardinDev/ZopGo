import {
  useAuthStore,
  isChauffeur,
  isHebergeur,
  chauffeurToLivreur,
  VEHICLE_TYPES,
  ACCOMMODATION_TYPES,
} from '../authStore';
import { useDriversStore } from '../driversStore';
import { fetchProfileByClerkId, upsertProfile } from '../../lib/supabaseProfile';
import { updatePushToken, fetchNotificationPreferences, updateNotificationPreferences } from '../../lib/supabaseNotifications';
import type { AuthUser, ChauffeurProfile, HebergeurProfile } from '../../types';

beforeEach(() => {
  jest.clearAllMocks();
  // Reset stores
  useAuthStore.setState({
    user: null,
    clerkId: null,
    supabaseProfileId: null,
    notificationPreferences: { courses: true, trajets: true, hebergements: true, promotions: true },
    _hasHydrated: false,
  });
  useDriversStore.setState({
    connectedDrivers: [],
    isLoading: false,
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

  it('creates chauffeur profile with default vehicle (moto)', () => {
    useAuthStore.getState().setupProfile('chauffeur', 'Pierre', 'pierre@test.com');
    const profile = useAuthStore.getState().user!.profile as ChauffeurProfile;
    expect(profile.vehicule.type).toBe('moto');
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

  it('clears push token in Supabase on logout', () => {
    useAuthStore.getState().setupProfile('client', 'Jean', 'jean@test.com', undefined, 'clerk_1');
    jest.clearAllMocks();
    useAuthStore.getState().logout();
    expect(updatePushToken).toHaveBeenCalledWith('clerk_1', null);
  });

  it('resets notification preferences to defaults', () => {
    useAuthStore.setState({
      notificationPreferences: { courses: false, trajets: false, hebergements: false, promotions: false },
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
    const prefs = { courses: false, trajets: false, hebergements: true, promotions: true };
    useAuthStore.getState().setNotificationPreferences(prefs);
    expect(useAuthStore.getState().notificationPreferences).toEqual(prefs);
    expect(updateNotificationPreferences).toHaveBeenCalledWith('clerk_1', prefs);
  });

  it('does not sync to Supabase when no clerkId', () => {
    const prefs = { courses: false, trajets: false, hebergements: true, promotions: true };
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
    expect(Object.keys(VEHICLE_TYPES)).toEqual(['velo', 'moto', 'voiture', 'camionnette']);
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
