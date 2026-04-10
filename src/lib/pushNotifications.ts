/**
 * Centralised push notification helpers.
 *
 * One call site for every outbound push in the app. Handles:
 *   - Fetching the recipient's profile (push_token + notification_preferences)
 *     in a single round-trip.
 *   - Respecting the user's notification_preferences[category] toggle.
 *   - Creating the in-app notification record (unless opted out for chat).
 *   - Firing the Expo push via the existing low-level helper.
 *
 * All functions are non-throwing: the caller is expected to `void`
 * the promise (fire-and-forget) so that a push failure never blocks the
 * business action that triggered it.
 */

import { supabase } from './supabase';
import {
  createNotification,
  sendPushNotification,
} from './supabaseNotificationsCreate';
import type { NotificationCategory } from '../types';

// --- Category metadata (icon + colours) --------------------------------

const CATEGORY_META: Record<
  NotificationCategory,
  { icon: string; color: string; bg: string }
> = {
  courses: { icon: 'car', color: '#2162FE', bg: '#DBEAFE' },
  trajets: { icon: 'navigate', color: '#10B981', bg: '#D1FAE5' },
  hebergements: { icon: 'bed', color: '#8B5CF6', bg: '#EDE9FE' },
  promotions: { icon: 'megaphone', color: '#F59E0B', bg: '#FEF3C7' },
  messages: { icon: 'chatbubble', color: '#2162FE', bg: '#DBEAFE' },
};

export function getCategoryMeta(category: NotificationCategory) {
  return CATEGORY_META[category];
}

// --- sendPushIfAllowed --------------------------------------------------

export interface SendPushIfAllowedParams {
  /** Supabase profiles.id (UUID). NOT a clerk_id. */
  recipientProfileId: string;
  category: NotificationCategory;
  /** Fine-grained type (e.g. 'reservation_acceptee', 'trajet_annule'). */
  type: string;
  title: string;
  /** Push body text. Also used as in-app message if `message` is omitted. */
  body: string;
  /** Override the in-app message (defaults to `body`). */
  message?: string;
  /** Override category default icon. */
  icon?: string;
  iconColor?: string;
  iconBg?: string;
  /** Extra payload merged into data (category + icons auto-added). */
  data?: Record<string, string>;
  /** Default: true. Set to false for chat messages. */
  createInAppRecord?: boolean;
  /** Default: true. Set to false for critical notifications (unused for now). */
  respectPreferences?: boolean;
}

export type SkippedReason =
  | 'no_token'
  | 'pref_disabled'
  | 'profile_not_found'
  | 'error';

export interface SendPushIfAllowedResult {
  inAppCreated: boolean;
  pushSent: boolean;
  skippedReason?: SkippedReason;
}

export async function sendPushIfAllowed(
  params: SendPushIfAllowedParams
): Promise<SendPushIfAllowedResult> {
  const {
    recipientProfileId,
    category,
    type,
    title,
    body,
    message,
    icon,
    iconColor,
    iconBg,
    data,
    createInAppRecord = true,
    respectPreferences = true,
  } = params;

  const meta = CATEGORY_META[category];
  const finalIcon = icon || meta.icon;
  const finalIconColor = iconColor || meta.color;
  const finalIconBg = iconBg || meta.bg;
  const inAppMessage = message ?? body;

  const result: SendPushIfAllowedResult = {
    inAppCreated: false,
    pushSent: false,
  };

  try {
    // Single round-trip to fetch both push_token and preferences
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('push_token, notification_preferences')
      .eq('id', recipientProfileId)
      .maybeSingle();

    if (error || !profile) {
      result.skippedReason = 'profile_not_found';
      return result;
    }

    const prefs = (profile.notification_preferences ?? {}) as Record<
      string,
      boolean
    >;
    const preferenceAllows =
      !respectPreferences || prefs[category] !== false;

    // 1) In-app record — always created (unless explicitly skipped),
    //    even if the push is muted, so the user sees it in their list.
    if (createInAppRecord) {
      const created = await createNotification({
        recipient_id: recipientProfileId,
        type,
        title,
        message: inAppMessage,
        icon: finalIcon,
        icon_color: finalIconColor,
        icon_bg: finalIconBg,
        data: { category, ...(data || {}) },
      });
      result.inAppCreated = created;
    }

    // 2) Push — only if allowed by prefs and a token exists.
    if (!preferenceAllows) {
      result.skippedReason = 'pref_disabled';
      return result;
    }

    const pushToken = profile.push_token as string | null;
    if (!pushToken) {
      result.skippedReason = 'no_token';
      return result;
    }

    const sent = await sendPushNotification(pushToken, title, body, {
      category,
      type,
      icon: finalIcon,
      iconColor: finalIconColor,
      iconBg: finalIconBg,
      ...(data || {}),
    });
    result.pushSent = sent;
    if (!sent) {
      result.skippedReason = 'error';
    }
    return result;
  } catch (err) {
    if (__DEV__) {
      console.error('[sendPushIfAllowed] unexpected error:', err);
    }
    result.skippedReason = 'error';
    return result;
  }
}

// --- sendPushBroadcast --------------------------------------------------

export interface SendPushBroadcastParams {
  category: NotificationCategory;
  /**
   * Filter recipients by role. Use `'all'` to broadcast to everyone with
   * a push token. Mutually exclusive with `recipientProfileIds`.
   */
  recipientRole?: 'client' | 'chauffeur' | 'hebergeur' | 'all';
  /** Explicit list of profile UUIDs. Used for targeted batch sends. */
  recipientProfileIds?: string[];
  title: string;
  message: string;
  data?: Record<string, string>;
}

/**
 * Broadcasts a push to many recipients via the `send-push` Edge Function.
 *
 * Use this for wide fan-outs like "new trajet available" (notifies all
 * clients). For 1-N targeted sends with < 20 recipients, prefer a loop
 * of `sendPushIfAllowed` calls — it avoids the Edge Function round-trip
 * and respects preferences with per-recipient granularity.
 */
export async function sendPushBroadcast(
  params: SendPushBroadcastParams
): Promise<{ invoked: boolean; error?: string }> {
  try {
    const { error } = await supabase.functions.invoke('send-push', {
      body: {
        category: params.category,
        recipientRole: params.recipientRole,
        recipientProfileIds: params.recipientProfileIds,
        title: params.title,
        message: params.message,
        data: params.data,
      },
    });

    if (error) {
      if (__DEV__) {
        console.error('[sendPushBroadcast] invoke error:', error.message);
      }
      return { invoked: false, error: error.message };
    }
    return { invoked: true };
  } catch (err) {
    if (__DEV__) {
      console.error('[sendPushBroadcast] unexpected error:', err);
    }
    return {
      invoked: false,
      error: err instanceof Error ? err.message : 'unknown error',
    };
  }
}
