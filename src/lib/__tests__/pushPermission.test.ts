// Permission helpers — we mock expo-notifications + Linking so we can
// drive every branch (undetermined / granted / denied / unsupported).

import { Linking } from 'react-native';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    executionEnvironment: 'standalone',
  },
  ExecutionEnvironment: { StoreClient: 'storeClient', Standalone: 'standalone' },
}));

import * as Notifications from 'expo-notifications';
import {
  getPushPermissionStatus,
  requestPushPermission,
} from '../pushPermission';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getPushPermissionStatus', () => {
  it('maps native "granted" to "granted"', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    expect(await getPushPermissionStatus()).toBe('granted');
  });

  it('maps native "denied" to "denied"', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
    expect(await getPushPermissionStatus()).toBe('denied');
  });

  it('maps anything else to "undetermined"', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'undetermined' });
    expect(await getPushPermissionStatus()).toBe('undetermined');
  });

  it('returns "unsupported" when the call throws', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockRejectedValue(new Error('native module unavailable'));
    expect(await getPushPermissionStatus()).toBe('unsupported');
  });
});

describe('requestPushPermission', () => {
  it('short-circuits when already granted (no prompt, no settings)', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

    const result = await requestPushPermission();

    expect(result).toEqual({ status: 'granted', openedSettings: false });
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(Linking.openSettings).not.toHaveBeenCalled();
  });

  it('triggers the OS prompt when undetermined and propagates the outcome', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'undetermined' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

    const result = await requestPushPermission();

    expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: 'granted', openedSettings: false });
  });

  it('reports denied when the OS prompt was rejected', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'undetermined' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

    const result = await requestPushPermission();
    expect(result).toEqual({ status: 'denied', openedSettings: false });
  });

  it('opens OS settings when already denied (the only recovery path)', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
    (Linking.openSettings as jest.Mock).mockResolvedValue(undefined);

    const result = await requestPushPermission();

    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(Linking.openSettings).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: 'denied', openedSettings: true });
  });

  it('returns openedSettings=false when Linking.openSettings throws', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
    (Linking.openSettings as jest.Mock).mockRejectedValue(new Error('linking failed'));

    const result = await requestPushPermission();
    expect(result).toEqual({ status: 'denied', openedSettings: false });
  });
});
