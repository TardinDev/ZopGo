/**
 * Acquisition et persistance du token push.
 *
 * Extrait de `usePushNotifications` parce que le hook n'était pas le seul
 * moment où un token peut devenir disponible : l'utilisateur qui refuse la
 * permission au premier lancement, puis l'accorde plus tard depuis les
 * Réglages, n'a jamais vu son token enregistre — l'effet du hook ne depend
 * que de `[clerkId, router]` et ne se relance pas. Les deux appelants
 * partagent desormais ce module.
 */
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { updatePushToken } from './supabaseNotifications';

// Expo Go (SDK 53+) ne supporte plus les push distants sur Android : le
// module natif leve des l'import, il faut donc eviter de le charger.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const pushNotificationsDisabled = isExpoGo && Platform.OS === 'android';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Notifications = pushNotificationsDisabled
  ? null
  : (require('expo-notifications') as typeof import('expo-notifications'));

/**
 * Recupere le token push de l'appareil, ou null si c'est impossible :
 * Expo Go sur Android, emulateur, permission refusee, ou erreur du module.
 */
export async function acquirePushToken(): Promise<string | null> {
  if (!Notifications) return null;

  // Les push ne fonctionnent que sur un appareil physique.
  if (!Device.isDevice) {
    if (__DEV__) console.log('Push notifications require a physical device');
    return null;
  }

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

  // Android : token FCM natif. On court-circuite le service Expo Push, ce
  // qui evite d'avoir a deposer des credentials FCM V1 sur EAS.
  if (Platform.OS === 'android') {
    try {
      const { data: token } = await Notifications.getDevicePushTokenAsync();
      if (__DEV__) {
        console.log('[Push] FCM device token:', String(token).substring(0, 30) + '...');
      }
      return String(token);
    } catch (err) {
      if (__DEV__) console.error('[Push] getDevicePushTokenAsync error:', err);
      return null;
    }
  }

  // iOS : Expo Push Token (routage APNs via Expo).
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
 * Acquiert le token puis le persiste sur le profil. Renvoie true seulement
 * si le token a bien ete ecrit en base — l'appelant peut donc distinguer
 * « notifications reellement actives » de « permission accordee mais token
 * absent », les deux cas ayant longtemps ete confondus dans l'UI.
 */
export async function registerAndPersistPushToken(
  clerkId: string | null
): Promise<boolean> {
  if (!clerkId) return false;

  const token = await acquirePushToken();
  if (!token) return false;

  return updatePushToken(clerkId, token);
}
