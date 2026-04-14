import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useRouter } from 'expo-router';
import { updatePushToken } from '../lib/supabaseNotifications';
import { useMessagesStore } from '../stores/messagesStore';
import { useSettingsStore } from '../stores/settingsStore';

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

// Configure foreground notification behavior (module-level, runs once)
if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: useSettingsStore.getState().generalSettings.notificationSound,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
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
export function usePushNotifications(clerkId: string | null) {
  const router = useRouter();
  const lastTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!clerkId || !Notifications) return;

    let notificationListener: { remove(): void } | undefined;
    let responseListener: { remove(): void } | undefined;

    (async () => {
      const token = await registerForPushNotifications();

      if (token && token !== lastTokenRef.current) {
        lastTokenRef.current = token;
        await updatePushToken(clerkId, token);
      }

      // Foreground notification → add to in-app store
      notificationListener = Notifications.addNotificationReceivedListener((notification) => {
        const { title, body, data } = notification.request.content;
        useMessagesStore.getState().addNotification({
          id: notification.request.identifier,
          type: (data?.category as string) || 'info',
          title: title || '',
          message: body || '',
          time: "À l'instant",
          read: false,
          icon: (data?.icon as string) || 'notifications',
          iconColor: (data?.iconColor as string) || '#2162FE',
          iconBg: (data?.iconBg as string) || '#DBEAFE',
        });
      });

      // Tap on notification → route based on payload type
      responseListener = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          const data = response.notification.request.content.data as
            | Record<string, string>
            | undefined;
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

          // Default: open the messages tab
          router.push('/(protected)/(tabs)/messages');
        }
      );
    })();

    return () => {
      notificationListener?.remove();
      responseListener?.remove();
    };
  }, [clerkId, router]);
}
