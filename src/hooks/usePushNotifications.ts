import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useRouter } from 'expo-router';
import { updatePushToken } from '../lib/supabaseNotifications';
import { useMessagesStore } from '../stores/messagesStore';
import { useSettingsStore } from '../stores/settingsStore';
import { toast } from '../stores/toastStore';

// Expo Go (SDK 53+) no longer supports remote push notifications on Android.
// The native module itself throws an error on import, so we must avoid loading
// expo-notifications entirely in that environment.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const pushNotificationsDisabled = isExpoGo && Platform.OS === 'android';

// Conditionally require expo-notifications to prevent the native module error
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Notifications = pushNotificationsDisabled
  ? null
  : (require('expo-notifications') as typeof import('expo-notifications'));

// Configure foreground notification behavior (module-level, runs once).
//
// When the app is in the foreground we suppress the native OS banner /
// alert: an in-app toast (fired from the addNotificationReceivedListener
// below) shows the same message without competing with the OS chrome.
// When the app is backgrounded/killed, the OS banner is the only surface
// the user sees, so we show it as normal.
if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => {
      const inForeground = AppState.currentState === 'active';
      const sound = useSettingsStore.getState().generalSettings.notificationSound;
      return {
        shouldShowAlert: !inForeground,
        shouldShowBanner: !inForeground,
        shouldShowList: true,
        shouldPlaySound: !inForeground && sound,
        shouldSetBadge: true,
      };
    },
  });
}

async function registerForPushNotifications(): Promise<string | null> {
  if (!Notifications) return null;

  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    if (__DEV__) console.log('Push notifications require a physical device');
    return null;
  }

  // Create Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'ZopGo',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2162FE',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });
  }

  // Check / request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    if (__DEV__) console.log('Push notification permission not granted');
    return null;
  }

  // On Android, get the native FCM device token directly.
  // This bypasses Expo Push Service and sends via Firebase Cloud Messaging,
  // eliminating the need for FCM V1 credentials on EAS.
  if (Platform.OS === 'android') {
    try {
      const { data: token } = await Notifications.getDevicePushTokenAsync();
      if (__DEV__) console.log('[Push] FCM device token:', String(token).substring(0, 30) + '...');
      return String(token);
    } catch (err) {
      if (__DEV__) console.error('[Push] getDevicePushTokenAsync error:', err);
      return null;
    }
  }

  // iOS: use Expo Push Token (APNs routing via Expo)
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

  if (!projectId) {
    if (__DEV__) console.log('[Push] Missing EAS projectId — run `eas init` first');
    return null;
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    if (__DEV__) console.log('[Push] Expo push token:', token);
    return token;
  } catch (err) {
    if (__DEV__) console.error('[Push] getExpoPushTokenAsync error:', err);
    return null;
  }
}

/**
 * Hook to register push notifications and handle foreground/tap events.
 * Pass `clerkId` when the user is signed in, or `null` when not.
 */
// Pure routing function — exported so the cold-launch handler + the live
// response listener share the same routing rules. Kept as a regular
// function rather than inlined so tests can verify mappings without
// rendering the hook.
function routeFromNotificationData(
  router: ReturnType<typeof useRouter>,
  data: Record<string, string> | undefined
): void {
  const type = data?.type;

  // Chat messages deep-link to the conversation with the sender
  if (type === 'direct_message' && data?.senderId) {
    router.push({
      pathname: '/(protected)/(tabs)/conversation',
      params: {
        receiverId: data.senderId,
        ...(data.reservationId && { reservationId: data.reservationId }),
      },
    });
    return;
  }

  // Reservation / status-flow events that carry context → also open conversation
  // so the client lands on the banner + can immediately rate/reply.
  if (
    (type === 'reservation_acceptee' || type === 'trajet_terminee') &&
    data?.chauffeurId &&
    data?.reservationId
  ) {
    router.push({
      pathname: '/(protected)/(tabs)/conversation',
      params: {
        receiverId: data.chauffeurId,
        ...(data.chauffeurName && { receiverName: data.chauffeurName }),
        reservationId: data.reservationId,
      },
    });
    return;
  }

  // Default: open the messages tab
  router.push('/(protected)/(tabs)/messages');
}

export function usePushNotifications(clerkId: string | null) {
  const router = useRouter();
  const lastTokenRef = useRef<string | null>(null);
  const handledColdLaunchRef = useRef(false);

  useEffect(() => {
    if (!clerkId || !Notifications) return;

    let notificationListener: { remove(): void } | undefined;
    let responseListener: { remove(): void } | undefined;
    let tokenListener: { remove(): void } | undefined;

    (async () => {
      const token = await registerForPushNotifications();

      if (token && token !== lastTokenRef.current) {
        lastTokenRef.current = token;
        await updatePushToken(clerkId, token);
      }

      // Cold-launch routing: if the app was opened by tapping a notification
      // while it was killed, `addNotificationResponseReceivedListener` may
      // not fire on Android (and isn't guaranteed on iOS either). We pull
      // the last response explicitly and route once per session.
      if (!handledColdLaunchRef.current) {
        try {
          const initial = await Notifications.getLastNotificationResponseAsync();
          if (initial?.notification?.request?.content?.data) {
            handledColdLaunchRef.current = true;
            routeFromNotificationData(
              router,
              initial.notification.request.content.data as Record<string, string> | undefined
            );
          }
        } catch (err) {
          if (__DEV__) console.warn('[Push] cold-launch route failed:', err);
        }
      }

      // Foreground notification arrived. We add it to the in-app
      // notification feed AND, when the app is active, surface a toast
      // (the OS banner is suppressed by the handler above).
      notificationListener = Notifications.addNotificationReceivedListener((notification) => {
        const { title, body, data } = notification.request.content;
        const inForeground = AppState.currentState === 'active';

        useMessagesStore.getState().addNotification({
          id: notification.request.identifier,
          type: (data?.category as string) || 'info',
          title: title || '',
          message: body || '',
          // Static label is kept for legacy consumers, but `createdAtMs`
          // below lets the card recompute "Il y a Nh" at render time.
          time: "À l'instant",
          createdAtMs: Date.now(),
          read: false,
          icon: (data?.icon as string) || 'notifications',
          iconColor: (data?.iconColor as string) || '#2162FE',
          iconBg: (data?.iconBg as string) || '#DBEAFE',
        });

        // Chat messages have their own UI (the conversation screen) so a
        // generic toast would be redundant when the user is already on
        // that screen. Still show one for every other category — that's
        // the "professional app" foreground UX (Slack / WhatsApp pattern).
        if (inForeground) {
          toast.info(body || '', {
            title: title || 'Notification',
            durationMs: 4000,
          });
        }
      });

      // Live tap-on-notification (app already running / backgrounded).
      responseListener = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          const data = response.notification.request.content.data as
            | Record<string, string>
            | undefined;
          routeFromNotificationData(router, data);
        }
      );

      // Token rotation: FCM (Android) may issue a new device token at any
      // time. Without this listener the old token stays in profiles.push_token
      // until the next cold start, breaking push delivery in the meantime.
      tokenListener = Notifications.addPushTokenListener?.((event) => {
        const next = typeof event === 'string' ? event : event?.data;
        if (!next || typeof next !== 'string') return;
        if (next === lastTokenRef.current) return;
        lastTokenRef.current = next;
        // Fire-and-forget — failure is non-fatal, will retry on next launch.
        void updatePushToken(clerkId, next);
        if (__DEV__) console.log('[Push] token rotated, persisted to Supabase');
      });
    })();

    return () => {
      notificationListener?.remove();
      responseListener?.remove();
      tokenListener?.remove();
    };
  }, [clerkId, router]);
}
