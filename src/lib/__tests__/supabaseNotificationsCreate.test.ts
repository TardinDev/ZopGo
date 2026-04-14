// Unmock so we test the real implementation
jest.unmock('../supabaseNotificationsCreate');

import { supabase } from '../supabase';
import {
  sendPushNotification,
  isExpoPushToken,
  createNotification,
  getProfilePushToken,
  markNotificationAsReadInDb,
} from '../supabaseNotificationsCreate';

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  // Reset global.fetch to a simple success
  (global.fetch as jest.Mock).mockImplementation(() =>
    Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ data: [{ status: 'ok', id: 'ticket-1' }] }) })
  );
});

// ---------------------------------------------------------------------------
// isExpoPushToken
// ---------------------------------------------------------------------------

describe('isExpoPushToken', () => {
  it('returns true for ExponentPushToken', () => {
    expect(isExpoPushToken('ExponentPushToken[abcdef123]')).toBe(true);
  });

  it('returns false for raw FCM token', () => {
    expect(isExpoPushToken('dGVzdA:APA91bSomeToken')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isExpoPushToken('')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// sendPushNotification — Expo token path
// ---------------------------------------------------------------------------

describe('sendPushNotification (Expo token)', () => {
  const expoToken = 'ExponentPushToken[abc123]';

  it('sends via Expo Push API for Expo tokens', async () => {
    const result = await sendPushNotification(expoToken, 'Title', 'Body', {
      category: 'trajets',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://exp.host/--/api/v2/push/send',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining(expoToken),
      })
    );
    expect(result).toBe(true);
  });

  it('returns false when Expo API returns HTTP error', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
    });

    const result = await sendPushNotification(expoToken, 'T', 'B');
    expect(result).toBe(false);
  });

  it('returns false when Expo ticket has error status', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          data: [
            {
              status: 'error',
              message: 'InvalidCredentials',
              details: { error: 'InvalidCredentials' },
            },
          ],
        }),
    });

    const result = await sendPushNotification(expoToken, 'T', 'B');
    expect(result).toBe(false);
  });

  it('returns true when response body is not parseable (trusts HTTP 200)', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.reject(new Error('bad json')),
    });

    const result = await sendPushNotification(expoToken, 'T', 'B');
    expect(result).toBe(true);
  });

  it('returns false when fetch throws', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network'));

    const result = await sendPushNotification(expoToken, 'T', 'B');
    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// sendPushNotification — FCM token path
// ---------------------------------------------------------------------------

describe('sendPushNotification (FCM token)', () => {
  const fcmToken = 'dGVzdA:APA91bFakeToken';

  beforeEach(() => {
    // Mock supabase.functions.invoke
    (supabase as unknown as { functions: { invoke: jest.Mock } }).functions = {
      invoke: jest.fn().mockResolvedValue({ data: { sent: 1 }, error: null }),
    };
  });

  it('sends via Edge Function for FCM tokens', async () => {
    const result = await sendPushNotification(fcmToken, 'Title', 'Body', {
      category: 'messages',
    });

    const invoke = (supabase as unknown as { functions: { invoke: jest.Mock } })
      .functions.invoke;
    expect(invoke).toHaveBeenCalledWith('send-push', {
      body: expect.objectContaining({
        directTokens: [fcmToken],
        title: 'Title',
        message: 'Body',
        skipInAppRecord: true,
      }),
    });
    expect(result).toBe(true);
    // Should NOT call Expo Push API
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns false when Edge Function returns error', async () => {
    (supabase as unknown as { functions: { invoke: jest.Mock } }).functions = {
      invoke: jest
        .fn()
        .mockResolvedValue({ data: null, error: { message: 'oops' } }),
    };

    const result = await sendPushNotification(fcmToken, 'T', 'B');
    expect(result).toBe(false);
  });

  it('defaults category to messages when not provided in data', async () => {
    await sendPushNotification(fcmToken, 'T', 'B');

    const invoke = (supabase as unknown as { functions: { invoke: jest.Mock } })
      .functions.invoke;
    expect(invoke).toHaveBeenCalledWith('send-push', {
      body: expect.objectContaining({
        category: 'messages',
      }),
    });
  });
});

// ---------------------------------------------------------------------------
// createNotification
// ---------------------------------------------------------------------------

describe('createNotification', () => {
  it('inserts a notification record into Supabase', async () => {
    const chain: Record<string, jest.Mock> = {};
    chain.insert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue(chain);

    const result = await createNotification({
      recipient_id: 'uuid-1',
      type: 'trajets',
      title: 'Nouvelle réservation',
      message: "Quelqu'un a réservé",
    });

    expect(supabase.from).toHaveBeenCalledWith('notifications');
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient_id: 'uuid-1',
        type: 'trajets',
        title: 'Nouvelle réservation',
      })
    );
    expect(result).toBe(true);
  });

  it('returns false on Supabase error', async () => {
    const chain: Record<string, jest.Mock> = {};
    chain.insert = jest
      .fn()
      .mockResolvedValue({ error: { message: 'RLS violation' } });
    (supabase.from as jest.Mock).mockReturnValue(chain);

    const result = await createNotification({
      recipient_id: 'uuid-1',
      type: 'trajets',
      title: 't',
      message: 'm',
    });

    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getProfilePushToken
// ---------------------------------------------------------------------------

describe('getProfilePushToken', () => {
  it('returns push_token when profile exists', async () => {
    const chain: Record<string, jest.Mock> = {};
    chain.select = jest.fn().mockReturnValue(chain);
    chain.eq = jest.fn().mockReturnValue(chain);
    chain.single = jest
      .fn()
      .mockResolvedValue({ data: { push_token: 'tok123' }, error: null });
    (supabase.from as jest.Mock).mockReturnValue(chain);

    const result = await getProfilePushToken('profile-1');
    expect(result).toBe('tok123');
  });

  it('returns null when profile has no token', async () => {
    const chain: Record<string, jest.Mock> = {};
    chain.select = jest.fn().mockReturnValue(chain);
    chain.eq = jest.fn().mockReturnValue(chain);
    chain.single = jest
      .fn()
      .mockResolvedValue({ data: { push_token: null }, error: null });
    (supabase.from as jest.Mock).mockReturnValue(chain);

    const result = await getProfilePushToken('profile-1');
    expect(result).toBeNull();
  });

  it('returns null on error', async () => {
    const chain: Record<string, jest.Mock> = {};
    chain.select = jest.fn().mockReturnValue(chain);
    chain.eq = jest.fn().mockReturnValue(chain);
    chain.single = jest
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'not found' } });
    (supabase.from as jest.Mock).mockReturnValue(chain);

    const result = await getProfilePushToken('missing');
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// markNotificationAsReadInDb
// ---------------------------------------------------------------------------

describe('markNotificationAsReadInDb', () => {
  it('updates the notification read status', async () => {
    const chain: Record<string, jest.Mock> = {};
    chain.update = jest.fn().mockReturnValue(chain);
    chain.eq = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue(chain);

    const result = await markNotificationAsReadInDb('notif-1');

    expect(supabase.from).toHaveBeenCalledWith('notifications');
    expect(chain.update).toHaveBeenCalledWith({ read: true });
    expect(result).toBe(true);
  });

  it('returns false on error', async () => {
    const chain: Record<string, jest.Mock> = {};
    chain.update = jest.fn().mockReturnValue(chain);
    chain.eq = jest
      .fn()
      .mockResolvedValue({ error: { message: 'failed' } });
    (supabase.from as jest.Mock).mockReturnValue(chain);

    const result = await markNotificationAsReadInDb('notif-1');
    expect(result).toBe(false);
  });
});
