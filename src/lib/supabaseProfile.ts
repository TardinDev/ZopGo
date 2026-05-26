import { supabase } from './supabase';
import { sanitizeInput } from '../utils/validation';
import type { NotificationPreferences, UserRole } from '../types';

const VALID_ROLES: UserRole[] = ['client', 'chauffeur', 'hebergeur', 'agence'];

export interface SupabaseProfile {
  id: string;
  clerk_id: string;
  role: string;
  // Multi-role array (migration 023). Nullable in the TS layer because
  // freshly-fetched rows from a pre-migration DB or partial selects may
  // omit it; reads must go through `getEffectiveRoles` for the fallback.
  roles: string[] | null;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  rating: number;
  total_trips: number;
  total_deliveries: number;
  address: string;
  emergency_contact: string;
  disponible: boolean;
  member_since: string;
  push_token: string | null;
  notification_preferences: NotificationPreferences | null;
  // Agency fields (migration 027). NULL for non-agence accounts.
  agency_name: string | null;
  agency_logo_url: string | null;
}

// Returns the effective roles array for a profile: prefers the multi-role
// `roles` column, falls back to `[role]` when it is missing/empty (e.g. a
// row read before migration 023 was applied). Output is always non-empty
// and constrained to known UserRole values.
export function getEffectiveRoles(
  profile: Pick<SupabaseProfile, 'roles' | 'role'> | null | undefined
): UserRole[] {
  if (!profile) return [];
  const raw = profile.roles && profile.roles.length > 0 ? profile.roles : [profile.role];
  const filtered = raw.filter((r): r is UserRole =>
    VALID_ROLES.includes(r as UserRole)
  );
  return filtered.length > 0 ? Array.from(new Set(filtered)) : [];
}

// Build the canonical `roles` array to persist when creating a profile.
// Policy (migration 023): every user implicitly owns 'client', plus their
// declared active role. Dedup + filter to valid values.
/**
 * Returns the full set of roles granted to every user. Every account can
 * be client AND chauffeur AND hebergeur — switching is purely a UI choice,
 * not gated on verification. The `activeRole` parameter is no longer used
 * (kept for backwards compatibility with older callers) — instead the
 * picked role at signup becomes the *initial* active role, while all
 * three are made available for the mode switcher.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function buildDefaultRoles(activeRole?: UserRole): UserRole[] {
  return ['client', 'chauffeur', 'hebergeur'];
}

export async function fetchProfileByClerkId(clerkId: string): Promise<SupabaseProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('clerk_id', clerkId)
    .single();

  if (error || !data) {
    // PGRST116 = no rows (legitimate first-login case); other codes are real failures.
    if (error && error.code !== 'PGRST116') {
      console.warn('[fetchProfileByClerkId] FAILED', { code: error.code, message: error.message });
    }
    return null;
  }
  console.log('[fetchProfileByClerkId] OK', data.id);
  return data as SupabaseProfile;
}

export async function upsertProfile(
  clerkId: string,
  profileData: {
    role: UserRole;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    disponible?: boolean;
    // Optional explicit override; when omitted we derive `['client', role]`.
    roles?: UserRole[];
  }
): Promise<SupabaseProfile | null> {
  const roles =
    profileData.roles && profileData.roles.length > 0
      ? Array.from(new Set(profileData.roles)).filter((r) =>
          VALID_ROLES.includes(r)
        )
      : buildDefaultRoles(profileData.role);

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        clerk_id: clerkId,
        role: profileData.role,
        roles,
        name: sanitizeInput(profileData.name),
        email: sanitizeInput(profileData.email),
        phone: profileData.phone || '',
        avatar: profileData.avatar || '',
        address: '',
        emergency_contact: '',
        disponible: profileData.disponible ?? false,
      },
      { onConflict: 'clerk_id' }
    )
    .select()
    .single();

  if (error) {
    console.warn('[upsertProfile] FAILED', { code: error.code, message: error.message, details: error.details });
    throw new Error(error.message);
  }
  console.log('[upsertProfile] OK', (data as SupabaseProfile).id);
  return data as SupabaseProfile;
}

export async function updateProfile(
  clerkId: string,
  updates: Partial<{
    name: string;
    phone: string;
    avatar: string;
    address: string;
    emergency_contact: string;
    disponible: boolean;
    rating: number;
    total_trips: number;
    total_deliveries: number;
    // The *active* role. Needed by the in-app mode switcher
    // (authStore.switchRole) so the next cold start reads the
    // up-to-date role from Supabase as well as from Clerk metadata.
    role: 'client' | 'chauffeur' | 'hebergeur' | 'agence';
    agency_name: string;
    agency_logo_url: string;
  }>
): Promise<boolean> {
  const sanitizedUpdates = { ...updates };
  if (sanitizedUpdates.name) sanitizedUpdates.name = sanitizeInput(sanitizedUpdates.name);

  const { error } = await supabase
    .from('profiles')
    .update(sanitizedUpdates)
    .eq('clerk_id', clerkId);

  if (error) {
    if (__DEV__) console.error('Supabase updateProfile error:', error.message);
    return false;
  }
  return true;
}
