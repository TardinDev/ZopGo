import { supabase } from './supabase';

export interface CreateNotificationParams {
  recipient_id: string;
  type: string;
  title: string;
  message: string;
  icon?: string;
  icon_color?: string;
  icon_bg?: string;
  data?: Record<string, string>;
}

export async function createNotification(params: CreateNotificationParams): Promise<boolean> {
  const { error } = await supabase.from('notifications').insert({
    recipient_id: params.recipient_id,
    type: params.type,
    title: params.title,
    message: params.message,
    icon: params.icon || 'information-circle',
    icon_color: params.icon_color || '#6366F1',
    icon_bg: params.icon_bg || '#E0E7FF',
    data: params.data || {},
  });

  if (error) {
    if (__DEV__) console.error('Error creating notification:', error.message);
    return false;
  }
  return true;
}

export async function markNotificationAsReadInDb(notificationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);

  if (error) {
    if (__DEV__) console.error('markNotificationAsReadInDb error:', error.message);
    return false;
  }
  return true;
}

export async function getProfilePushToken(profileId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('push_token')
    .eq('id', profileId)
    .single();

  if (error || !data?.push_token) {
    return null;
  }
  return data.push_token as string;
}

export async function sendPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> {
  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: pushToken,
        title,
        body,
        data: data || {},
        sound: 'default',
        priority: 'high',
        channelId: 'default',
      }),
    });

    if (!response.ok) {
      if (__DEV__) console.error('Push notification failed:', response.status);
      return false;
    }
    return true;
  } catch (err) {
    if (__DEV__) console.error('Push notification error:', err);
    return false;
  }
}
