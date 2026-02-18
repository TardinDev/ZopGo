import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { updatePushToken } from '../lib/supabaseNotifications';
import { useMessagesStore } from '../stores/messagesStore';

// Configure foreground notification behavior (module-level, runs once)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotifications(): Promise<string | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Create Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2162FE',
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
    console.log('Push notification permission not granted');
    return null;
  }

  // Get Expo push token
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

  if (!projectId) {
    console.log('Missing EAS projectId — run `eas init` first');
    return null;
  }

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  return token;
}

/**
 * Hook to register push notifications and handle foreground/tap events.
 * Pass `clerkId` when the user is signed in, or `null` when not.
 */
export function usePushNotifications(clerkId: string | null) {
  const router = useRouter();
  const lastTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!clerkId) return;

    let notificationListener: Notifications.EventSubscription | undefined;
    let responseListener: Notifications.EventSubscription | undefined;

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

      // Tap on notification → navigate to messages
      responseListener = Notifications.addNotificationResponseReceivedListener(() => {
        router.push('/(protected)/(tabs)/messages');
      });
    })();

    return () => {
      notificationListener?.remove();
      responseListener?.remove();
    };
  }, [clerkId, router]);
}
