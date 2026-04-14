import { supabase } from './supabase';

/** Check whether a token is an Expo Push Token vs a native FCM/APNs token. */
export function isExpoPushToken(token: string): boolean {
  return token.startsWith('ExponentPushToken[');
}

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

/**
 * Send a push notification to a single device.
 *
 * - **Expo tokens** (`ExponentPushToken[...]`): sent via Expo Push API with
 *   full response-body parsing so ticket-level errors are detected.
 * - **FCM device tokens** (raw strings): routed through the `send-push`
 *   Supabase Edge Function which calls FCM v1 API directly. This avoids
 *   needing FCM V1 credentials uploaded to EAS.
 */
export async function sendPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> {
  try {
    if (isExpoPushToken(pushToken)) {
      // --- Expo Push API (iOS / legacy tokens) ---
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
        if (__DEV__) console.error('[Push] Expo HTTP error:', response.status);
        return false;
      }

      // Parse response body — Expo returns 200 OK even when individual
      // tickets have errors (e.g. InvalidCredentials, DeviceNotRegistered).
      try {
        const result = await response.json();
        const ticket = Array.isArray(result?.data) ? result.data[0] : result?.data;
        if (ticket?.status === 'error') {
          if (__DEV__) {
            console.error(
              '[Push] Expo ticket error:',
              ticket.message,
              ticket.details?.error
            );
          }
          return false;
        }
      } catch {
        // If we can't parse the body, trust the HTTP 200
      }

      return true;
    }

    // --- FCM device token → send via Edge Function (FCM v1 API) ---
    const { error } = await supabase.functions.invoke('send-push', {
      body: {
        directTokens: [pushToken],
        title,
        message: body,
        data: data || {},
        category: (data?.category as string) || 'messages',
        skipInAppRecord: true,
      },
    });

    if (error) {
      if (__DEV__) console.error('[Push] Edge Function error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    if (__DEV__) console.error('[Push] sendPushNotification error:', err);
    return false;
  }
}
