/**
 * Regression guard — le token push n'était jamais enregistré après une
 * autorisation accordée depuis les réglages.
 *
 * `requestPushPermission()` obtient bien la permission OS mais ne fait que
 * renvoyer un statut. L'écran Réglages affichait « Notifications activées. »
 * alors qu'aucun token n'avait été acquis ni persisté, et l'effet de
 * `usePushNotifications` ne dépend que de `[clerkId, router]` : il ne se
 * relance pas. Résultat, un utilisateur ayant refusé au premier lancement
 * puis accepté depuis les réglages ne recevait plus jamais rien, en croyant
 * les notifications actives.
 */

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    executionEnvironment: 'standalone',
    expoConfig: { extra: { eas: { projectId: 'test-project-id' } } },
  },
  ExecutionEnvironment: { StoreClient: 'storeClient', Standalone: 'standalone' },
}));

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { updatePushToken } from '../supabaseNotifications';
import { acquirePushToken, registerAndPersistPushToken } from '../pushRegistration';

const mockedUpdate = updatePushToken as jest.MockedFunction<typeof updatePushToken>;

beforeEach(() => {
  jest.clearAllMocks();
  (Device as { isDevice: boolean }).isDevice = true;
  Platform.OS = 'android';
  (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
    status: 'granted',
  });
  (Notifications.setNotificationChannelAsync as jest.Mock)?.mockResolvedValue?.(
    undefined
  );
  (Notifications.getDevicePushTokenAsync as jest.Mock).mockResolvedValue({
    data: 'fcm-device-token-abc',
  });
  mockedUpdate.mockResolvedValue(true);
});

describe('acquirePushToken', () => {
  it('renvoie le token FCM sur Android', async () => {
    await expect(acquirePushToken()).resolves.toBe('fcm-device-token-abc');
  });

  it('renvoie null quand la permission est refusée', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied',
    });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied',
    });

    await expect(acquirePushToken()).resolves.toBeNull();
  });

  it("renvoie null hors d'un appareil physique", async () => {
    (Device as { isDevice: boolean }).isDevice = false;

    await expect(acquirePushToken()).resolves.toBeNull();
  });
});

describe('registerAndPersistPushToken', () => {
  it('persiste le token — le maillon qui manquait après une activation tardive', async () => {
    const ok = await registerAndPersistPushToken('user_abc');

    expect(ok).toBe(true);
    expect(mockedUpdate).toHaveBeenCalledWith('user_abc', 'fcm-device-token-abc');
  });

  it('ne persiste rien sans clerkId', async () => {
    const ok = await registerAndPersistPushToken(null);

    expect(ok).toBe(false);
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it("ne persiste rien quand aucun token n'a pu être acquis", async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied',
    });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied',
    });

    const ok = await registerAndPersistPushToken('user_abc');

    expect(ok).toBe(false);
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it("remonte l'échec quand l'écriture en base échoue", async () => {
    mockedUpdate.mockResolvedValue(false);

    await expect(registerAndPersistPushToken('user_abc')).resolves.toBe(false);
  });
});
