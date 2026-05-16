import { supabase } from './supabase';
import type { NotificationPreferences } from '../types';

const DEFAULT_PREFS: NotificationPreferences = {
  courses: true,
  trajets: true,
  hebergements: true,
  promotions: true,
  messages: true,
};

export { DEFAULT_PREFS };

export async function updatePushToken(clerkId: string, token: string | null): Promise<boolean> {
  // .select('id') so we can detect the "0 rows matched" case explicitly.
  // Used to silently succeed even when the profile row didn't exist yet,
  // which dropped the user's push token on first login.
  const { data, error } = await supabase
    .from('profiles')
    .update({ push_token: token })
    .eq('clerk_id', clerkId)
    .select('id');

  if (error) {
    if (__DEV__) console.error('updatePushToken error:', error.message);
    return false;
  }
  if (!Array.isArray(data) || data.length === 0) {
    console.warn(
      `[updatePushToken] no profile row matched clerk_id=${clerkId} — token NOT persisted. ` +
        'Profile upsert may not have run yet, or RLS denied the update.'
    );
    return false;
  }
  return true;
}

export async function updateNotificationPreferences(
  clerkId: string,
  prefs: NotificationPreferences
): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .update({ notification_preferences: prefs })
    .eq('clerk_id', clerkId);

  if (error) {
    if (__DEV__) console.error('updateNotificationPreferences error:', error.message);
    return false;
  }
  return true;
}

export async function fetchNotificationPreferences(
  clerkId: string
): Promise<NotificationPreferences> {
  const { data, error } = await supabase
    .from('profiles')
    .select('notification_preferences')
    .eq('clerk_id', clerkId)
    .single();

  if (error || !data?.notification_preferences) {
    return DEFAULT_PREFS;
  }
  return data.notification_preferences as NotificationPreferences;
}
