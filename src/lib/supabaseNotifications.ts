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
  const { error } = await supabase
    .from('profiles')
    .update({ push_token: token })
    .eq('clerk_id', clerkId);

  if (error) {
    if (__DEV__) console.error('updatePushToken error:', error.message);
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
