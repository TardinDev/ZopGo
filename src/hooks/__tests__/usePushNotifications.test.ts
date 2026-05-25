// Hook-level tests for usePushNotifications. We mock expo-notifications,
// expo-device, expo-constants, expo-router and the supabase notif lib so
// we can isolate the hook's logic from real native modules.

import { renderHook, act } from '@testing-library/react-native';
import { AppState, Platform } from 'react-native';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
}));

// jest.mock factories are hoisted above `const` declarations, so any
// out-of-scope reference (even `mock`-prefixed) is in the TDZ when the
// factory runs. Declaring the jest.fns inside the factory keeps them
// initialised; tests access them via the imported `toast` object.
jest.mock('../../stores/toastStore', () => ({
  toast: {
    info: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
  },
  useToastStore: {
    getState: () => ({ show: jest.fn(), dismiss: jest.fn() }),
  },
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    executionEnvironment: 'standalone',
    expoConfig: { extra: { eas: { projectId: 'proj-1' } } },
    easConfig: { projectId: 'proj-1' },
  },
  ExecutionEnvironment: { StoreClient: 'storeClient', Standalone: 'standalone' },
}));

import * as Notifications from 'expo-notifications';
import { useMessagesStore } from '../../stores/messagesStore';
import { updatePushToken } from '../../lib/supabaseNotifications';
import { toast } from '../../stores/toastStore';
import { usePushNotifications } from '../usePushNotifications';

// `addPushTokenListener` isn't in jest-expo's auto-mock surface. The
// module namespace from `import * as Notifications` is sealed, so we
// stamp the function onto the *CommonJS exports* object that the hook's
// `require('expo-notifications')` returns — they point at the same
// underlying mock module, but the CJS exports object is writable.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const NotificationsCjs = require('expo-notifications') as Record<string, unknown>;
if (typeof NotificationsCjs.addPushTokenListener !== 'function') {
  NotificationsCjs.addPushTokenListener = jest.fn();
}

// Capture the listeners the hook registers so we can fire events at them.
let foregroundCb: ((n: unknown) => void) | null = null;
let responseCb: ((r: unknown) => void) | null = null;
let tokenCb: ((event: { data?: string } | string) => void) | null = null;

function setAppState(state: 'active' | 'background' | 'inactive') {
  (AppState as { currentState: string }).currentState = state;
}

beforeEach(() => {
  jest.clearAllMocks();
  foregroundCb = null;
  responseCb = null;
  tokenCb = null;
  Platform.OS = 'ios';
  setAppState('active');

  (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
  (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
  (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({ data: 'ExponentPushToken[ios-token]' });
  (Notifications.getDevicePushTokenAsync as jest.Mock).mockResolvedValue({ data: 'fcm-device-token' });
  (Notifications.setNotificationChannelAsync as jest.Mock).mockResolvedValue(undefined);

  (Notifications.addNotificationReceivedListener as jest.Mock).mockImplementation((cb) => {
    foregroundCb = cb;
    return { remove: jest.fn() };
  });
  (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockImplementation((cb) => {
    responseCb = cb;
    return { remove: jest.fn() };
  });
  (NotificationsCjs.addPushTokenListener as jest.Mock).mockImplementation((cb) => {
    tokenCb = cb;
    return { remove: jest.fn() };
  });
  // Default: no cold-launch notification — individual tests override
  (Notifications.getLastNotificationResponseAsync as jest.Mock).mockResolvedValue(null);

  // updatePushToken is already mocked in jest.setup.js — reset its history
  (updatePushToken as jest.Mock).mockClear();
  (updatePushToken as jest.Mock).mockResolvedValue(true);

  // Reset the messages store
  useMessagesStore.setState({ notifications: [], messages: [], selectedTab: 'annonces' } as never);
});

async function flushAsync() {
  // microtasks for the inner registration IIFE
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('usePushNotifications — gating', () => {
  it('does nothing when clerkId is null (user signed out)', async () => {
    renderHook(() => usePushNotifications(null));
    await flushAsync();

    expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();
    expect(updatePushToken).not.toHaveBeenCalled();
  });
});

describe('usePushNotifications — iOS Expo push token path', () => {
  it('persists the Expo token on first registration', async () => {
    renderHook(() => usePushNotifications('clk_1'));
    await flushAsync();

    expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: 'proj-1' });
    expect(updatePushToken).toHaveBeenCalledWith('clk_1', 'ExponentPushToken[ios-token]');
  });

  it('does not re-persist the same token across re-renders', async () => {
    const { rerender } = renderHook<void, { id: string }>(
      ({ id }) => usePushNotifications(id),
      { initialProps: { id: 'clk_1' } }
    );
    await flushAsync();
    expect(updatePushToken).toHaveBeenCalledTimes(1);

    // Force re-render with the same id — token unchanged, no extra write.
    rerender({ id: 'clk_1' });
    await flushAsync();
    expect(updatePushToken).toHaveBeenCalledTimes(1);
  });

  it('requests permissions when current status is not granted', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'undetermined' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'granted' });

    renderHook(() => usePushNotifications('clk_1'));
    await flushAsync();

    expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(updatePushToken).toHaveBeenCalled();
  });

  it('bails out gracefully when permission is denied', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied' });

    renderHook(() => usePushNotifications('clk_1'));
    await flushAsync();

    expect(updatePushToken).not.toHaveBeenCalled();
  });
});

describe('usePushNotifications — Android FCM path', () => {
  beforeEach(() => {
    Platform.OS = 'android';
  });

  it('uses the device token (not Expo) on Android', async () => {
    renderHook(() => usePushNotifications('clk_1'));
    await flushAsync();

    expect(Notifications.getDevicePushTokenAsync).toHaveBeenCalled();
    expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
    expect(updatePushToken).toHaveBeenCalledWith('clk_1', 'fcm-device-token');
  });

  it('creates the default notification channel before fetching the token', async () => {
    renderHook(() => usePushNotifications('clk_1'));
    await flushAsync();

    expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
      'default',
      expect.objectContaining({
        name: 'ZopGo',
        importance: 5,
        lightColor: '#2162FE',
        sound: 'default',
      })
    );
  });
});

describe('usePushNotifications — foreground listener', () => {
  it('pipes incoming notifications into the in-app store', async () => {
    renderHook(() => usePushNotifications('clk_1'));
    await flushAsync();

    expect(foregroundCb).toBeTruthy();
    act(() => {
      foregroundCb!({
        request: {
          identifier: 'notif-1',
          content: {
            title: 'Nouveau trajet',
            body: 'Libreville → Oyem',
            data: {
              category: 'trajets',
              icon: 'navigate',
              iconColor: '#10B981',
              iconBg: '#D1FAE5',
            },
          },
        },
      });
    });

    const { notifications } = useMessagesStore.getState();
    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toMatchObject({
      id: 'notif-1',
      type: 'trajets',
      title: 'Nouveau trajet',
      message: 'Libreville → Oyem',
      icon: 'navigate',
      iconColor: '#10B981',
      iconBg: '#D1FAE5',
      read: false,
    });
  });

  it('falls back to "info" when category is missing', async () => {
    renderHook(() => usePushNotifications('clk_1'));
    await flushAsync();

    act(() => {
      foregroundCb!({
        request: {
          identifier: 'notif-2',
          content: { title: 'X', body: 'Y', data: null },
        },
      });
    });

    expect(useMessagesStore.getState().notifications[0].type).toBe('info');
  });
});

describe('usePushNotifications — tap response routing', () => {
  it('direct_message taps deep-link to conversation with the sender', async () => {
    renderHook(() => usePushNotifications('clk_1'));
    await flushAsync();

    act(() => {
      responseCb!({
        notification: {
          request: {
            content: {
              data: {
                type: 'direct_message',
                senderId: 'user-123',
                reservationId: 'res-42',
              },
            },
          },
        },
      });
    });

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(protected)/(tabs)/conversation',
      params: {
        receiverId: 'user-123',
        reservationId: 'res-42',
      },
    });
  });

  it('falls back to the messages tab for unknown notification types', async () => {
    renderHook(() => usePushNotifications('clk_1'));
    await flushAsync();

    act(() => {
      responseCb!({
        notification: {
          request: {
            content: {
              data: { type: 'reservation_acceptee', reservationId: 'r-1' },
            },
          },
        },
      });
    });

    expect(mockPush).toHaveBeenCalledWith('/(protected)/(tabs)/messages');
  });

  it('direct_message without senderId still falls back to messages tab', async () => {
    renderHook(() => usePushNotifications('clk_1'));
    await flushAsync();

    act(() => {
      responseCb!({
        notification: {
          request: { content: { data: { type: 'direct_message' } } },
        },
      });
    });

    expect(mockPush).toHaveBeenCalledWith('/(protected)/(tabs)/messages');
  });
});

describe('usePushNotifications — foreground UX (toast + createdAtMs)', () => {
  it('stamps every notification with createdAtMs so the card recomputes the relative label', async () => {
    renderHook(() => usePushNotifications('clk_1'));
    await flushAsync();

    const before = Date.now();
    act(() => {
      foregroundCb!({
        request: {
          identifier: 'notif-time',
          content: { title: 'T', body: 'B', data: {} },
        },
      });
    });
    const after = Date.now();

    const inserted = useMessagesStore.getState().notifications[0];
    expect(inserted.createdAtMs).toBeGreaterThanOrEqual(before);
    expect(inserted.createdAtMs).toBeLessThanOrEqual(after);
  });

  it('shows an in-app toast when a notification arrives while the app is foregrounded', async () => {
    setAppState('active');
    renderHook(() => usePushNotifications('clk_1'));
    await flushAsync();

    act(() => {
      foregroundCb!({
        request: {
          identifier: 'notif-fg',
          content: { title: 'Pierre M.', body: 'Salut !', data: { category: 'messages' } },
        },
      });
    });

    expect(toast.info).toHaveBeenCalledWith(
      'Salut !',
      expect.objectContaining({ title: 'Pierre M.' })
    );
  });

  it('does NOT show a toast when the app is in background (OS banner takes over)', async () => {
    setAppState('background');
    renderHook(() => usePushNotifications('clk_1'));
    await flushAsync();

    act(() => {
      foregroundCb!({
        request: {
          identifier: 'notif-bg',
          content: { title: 'X', body: 'Y', data: {} },
        },
      });
    });

    expect(toast.info).not.toHaveBeenCalled();
  });
});

describe('usePushNotifications — token rotation (Android FCM)', () => {
  it('registers a token listener on mount', async () => {
    renderHook(() => usePushNotifications('clk_1'));
    await flushAsync();

    expect(NotificationsCjs.addPushTokenListener).toHaveBeenCalledTimes(1);
    expect(tokenCb).toBeTruthy();
  });

  it('persists the new token to Supabase when it rotates', async () => {
    renderHook(() => usePushNotifications('clk_1'));
    await flushAsync();
    (updatePushToken as jest.Mock).mockClear();

    act(() => {
      tokenCb!({ data: 'ExponentPushToken[rotated-token]' });
    });

    expect(updatePushToken).toHaveBeenCalledWith('clk_1', 'ExponentPushToken[rotated-token]');
  });

  it('also accepts a raw string token shape (some SDK versions)', async () => {
    renderHook(() => usePushNotifications('clk_1'));
    await flushAsync();
    (updatePushToken as jest.Mock).mockClear();

    act(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tokenCb!('fcm-rotated-raw' as any);
    });

    expect(updatePushToken).toHaveBeenCalledWith('clk_1', 'fcm-rotated-raw');
  });

  it('ignores the rotation event when the token is unchanged', async () => {
    // The hook persisted ExponentPushToken[ios-token] on mount; firing the
    // same value through the listener must NOT cause a second write.
    renderHook(() => usePushNotifications('clk_1'));
    await flushAsync();
    (updatePushToken as jest.Mock).mockClear();

    act(() => {
      tokenCb!({ data: 'ExponentPushToken[ios-token]' });
    });

    expect(updatePushToken).not.toHaveBeenCalled();
  });

  it('ignores empty / non-string token payloads', async () => {
    renderHook(() => usePushNotifications('clk_1'));
    await flushAsync();
    (updatePushToken as jest.Mock).mockClear();

    act(() => {
      tokenCb!({ data: undefined });
      tokenCb!({ data: '' });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tokenCb!({ data: 42 as any });
    });

    expect(updatePushToken).not.toHaveBeenCalled();
  });
});

describe('usePushNotifications — cold-launch routing', () => {
  it('routes from the last notification when the app was killed and re-opened by tapping a push', async () => {
    (Notifications.getLastNotificationResponseAsync as jest.Mock).mockResolvedValueOnce({
      notification: {
        request: {
          content: {
            data: {
              type: 'direct_message',
              senderId: 'user-cold',
              reservationId: 'res-99',
            },
          },
        },
      },
    });

    renderHook(() => usePushNotifications('clk_1'));
    await flushAsync();

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(protected)/(tabs)/conversation',
      params: {
        receiverId: 'user-cold',
        reservationId: 'res-99',
      },
    });
  });

  it('does not route on cold-launch when there is no last notification', async () => {
    (Notifications.getLastNotificationResponseAsync as jest.Mock).mockResolvedValueOnce(null);

    renderHook(() => usePushNotifications('clk_1'));
    await flushAsync();

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('survives getLastNotificationResponseAsync errors without breaking registration', async () => {
    (Notifications.getLastNotificationResponseAsync as jest.Mock).mockRejectedValueOnce(
      new Error('platform error')
    );

    renderHook(() => usePushNotifications('clk_1'));
    await flushAsync();

    // Token still registered — cold-launch failure shouldn't break the flow
    expect(updatePushToken).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe('usePushNotifications — reservation deep-links', () => {
  it('reservation_acceptee → conversation with the chauffeur', async () => {
    renderHook(() => usePushNotifications('clk_1'));
    await flushAsync();

    act(() => {
      responseCb!({
        notification: {
          request: {
            content: {
              data: {
                type: 'reservation_acceptee',
                chauffeurId: 'cf-1',
                chauffeurName: 'Pierre',
                reservationId: 'res-1',
              },
            },
          },
        },
      });
    });

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(protected)/(tabs)/conversation',
      params: {
        receiverId: 'cf-1',
        receiverName: 'Pierre',
        reservationId: 'res-1',
      },
    });
  });

  it('trajet_terminee → conversation so the client lands on the "Noter" CTA', async () => {
    renderHook(() => usePushNotifications('clk_1'));
    await flushAsync();

    act(() => {
      responseCb!({
        notification: {
          request: {
            content: {
              data: {
                type: 'trajet_terminee',
                chauffeurId: 'cf-1',
                reservationId: 'res-1',
              },
            },
          },
        },
      });
    });

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(protected)/(tabs)/conversation',
      params: {
        receiverId: 'cf-1',
        reservationId: 'res-1',
      },
    });
  });

  it('falls back to messages tab when reservation push is missing chauffeurId', async () => {
    renderHook(() => usePushNotifications('clk_1'));
    await flushAsync();

    act(() => {
      responseCb!({
        notification: {
          request: {
            content: {
              data: { type: 'reservation_acceptee', reservationId: 'res-1' },
            },
          },
        },
      });
    });

    expect(mockPush).toHaveBeenCalledWith('/(protected)/(tabs)/messages');
  });
});

describe('usePushNotifications — lifecycle', () => {
  it('removes both listeners on unmount', async () => {
    const removeFg = jest.fn();
    const removeResp = jest.fn();
    (Notifications.addNotificationReceivedListener as jest.Mock).mockReturnValueOnce({ remove: removeFg });
    (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockReturnValueOnce({ remove: removeResp });

    const { unmount } = renderHook(() => usePushNotifications('clk_1'));
    await flushAsync();

    unmount();
    expect(removeFg).toHaveBeenCalledTimes(1);
    expect(removeResp).toHaveBeenCalledTimes(1);
  });
});
