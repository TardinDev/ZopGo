/**
 * Push-notification permission helpers.
 *
 * The OS-level permission prompt (`Notifications.requestPermissionsAsync`)
 * can only re-trigger the system dialog when the status is still
 * `undetermined`. Once the user has explicitly granted or denied, further
 * `request` calls are silent no-ops on iOS — the user has to flip the
 * switch from the OS Settings app. We expose two distinct entry points so
 * the calling UI can show the right copy and link out when needed.
 */
import { Linking, Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const pushNotificationsDisabled = isExpoGo && Platform.OS === 'android';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Notifications = pushNotificationsDisabled
  ? null
  : (require('expo-notifications') as typeof import('expo-notifications'));

export type PushPermissionStatus =
  | 'unsupported'   // Expo Go on Android, or no expo-notifications
  | 'undetermined'  // user has never been prompted
  | 'granted'       // user has explicitly granted
  | 'denied';       // user has explicitly denied (only OS Settings can flip)

export async function getPushPermissionStatus(): Promise<PushPermissionStatus> {
  if (!Notifications) return 'unsupported';
  try {
    const result = await Notifications.getPermissionsAsync();
    if (result.status === 'granted') return 'granted';
    if (result.status === 'denied') return 'denied';
    return 'undetermined';
  } catch {
    return 'unsupported';
  }
}

export interface RequestPushPermissionResult {
  status: PushPermissionStatus;
  /** True if we opened the OS Settings (only when already denied). */
  openedSettings: boolean;
}

/**
 * Re-asks the OS prompt if it hasn't been asked yet. When the user has
 * already denied, opens the OS Settings deep-link so they can flip the
 * toggle manually — the only path back on iOS / strict Android.
 */
export async function requestPushPermission(): Promise<RequestPushPermissionResult> {
  if (!Notifications) {
    return { status: 'unsupported', openedSettings: false };
  }

  const current = await getPushPermissionStatus();

  if (current === 'granted' || current === 'unsupported') {
    return { status: current, openedSettings: false };
  }

  if (current === 'undetermined') {
    try {
      const result = await Notifications.requestPermissionsAsync();
      if (result.status === 'granted') return { status: 'granted', openedSettings: false };
      if (result.status === 'denied') return { status: 'denied', openedSettings: false };
      return { status: 'undetermined', openedSettings: false };
    } catch {
      return { status: 'undetermined', openedSettings: false };
    }
  }

  // current === 'denied' — the system dialog won't re-appear. Deep-link
  // to the app's settings page so the user can flip the toggle.
  try {
    await Linking.openSettings();
    return { status: 'denied', openedSettings: true };
  } catch {
    return { status: 'denied', openedSettings: false };
  }
}
