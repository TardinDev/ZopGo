import { supabase } from './supabase';

export interface SupabaseProfile {
  id: string;
  clerk_id: string;
  role: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  rating: number;
  total_trips: number;
  total_deliveries: number;
  disponible: boolean;
  member_since: string;
}

export async function fetchProfileByClerkId(clerkId: string): Promise<SupabaseProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('clerk_id', clerkId)
    .single();

  if (error || !data) return null;
  return data as SupabaseProfile;
}

export async function upsertProfile(
  clerkId: string,
  profileData: {
    role: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    disponible?: boolean;
  }
): Promise<SupabaseProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        clerk_id: clerkId,
        role: profileData.role,
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone || '',
        avatar: profileData.avatar || '',
        disponible: profileData.disponible ?? false,
      },
      { onConflict: 'clerk_id' }
    )
    .select()
    .single();

  if (error) {
    console.error('Supabase upsertProfile error:', error.message);
    return null;
  }
  return data as SupabaseProfile;
}

export async function updateProfile(
  clerkId: string,
  updates: Partial<{
    name: string;
    phone: string;
    avatar: string;
    disponible: boolean;
    rating: number;
    total_trips: number;
    total_deliveries: number;
  }>
): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('clerk_id', clerkId);

  if (error) {
    console.error('Supabase updateProfile error:', error.message);
    return false;
  }
  return true;
}
