// Unmock this module so we test the real implementation
jest.unmock('../pushNotifications');

import { supabase } from '../supabase';
import {
  createNotification,
  sendPushNotification,
} from '../supabaseNotificationsCreate';
import { sendPushIfAllowed, sendPushBroadcast } from '../pushNotifications';

function mockProfileFetch(profile: unknown, error: unknown = null) {
  const chain: Record<string, jest.Mock> = {};
  ['select', 'eq'].forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain.maybeSingle = jest.fn().mockResolvedValue({ data: profile, error });
  chain.single = jest.fn().mockResolvedValue({ data: profile, error });
  (supabase.from as jest.Mock).mockReturnValue(chain);
  return chain;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('sendPushIfAllowed', () => {
  it('happy path: creates in-app record AND sends push', async () => {
    mockProfileFetch({
      push_token: 'ExponentPushToken[abc]',
      notification_preferences: {
        courses: true,
        trajets: true,
        hebergements: true,
        promotions: true,
        messages: true,
      },
    });
    (createNotification as jest.Mock).mockResolvedValue(true);
    (sendPushNotification as jest.Mock).mockResolvedValue(true);

    const result = await sendPushIfAllowed({
      recipientProfileId: 'profile-uuid-1',
      category: 'trajets',
      type: 'reservation_acceptee',
      title: 'Réservation acceptée',
      body: 'Le chauffeur a confirmé',
    });

    expect(createNotification).toHaveBeenCalledTimes(1);
    expect(sendPushNotification).toHaveBeenCalledWith(
      'ExponentPushToken[abc]',
      'Réservation acceptée',
      'Le chauffeur a confirmé',
      expect.objectContaining({ category: 'trajets' })
    );
    expect(result.inAppCreated).toBe(true);
    expect(result.pushSent).toBe(true);
    expect(result.skippedReason).toBeUndefined();
  });

  it('pref disabled: creates in-app record but does NOT send push', async () => {
    mockProfileFetch({
      push_token: 'ExponentPushToken[abc]',
      notification_preferences: {
        courses: true,
        trajets: false, // disabled
        hebergements: true,
        promotions: true,
        messages: true,
      },
    });
    (createNotification as jest.Mock).mockResolvedValue(true);

    const result = await sendPushIfAllowed({
      recipientProfileId: 'profile-uuid-1',
      category: 'trajets',
      type: 'reservation_acceptee',
      title: 'x',
      body: 'y',
    });

    expect(createNotification).toHaveBeenCalledTimes(1);
    expect(sendPushNotification).not.toHaveBeenCalled();
    expect(result.inAppCreated).toBe(true);
    expect(result.pushSent).toBe(false);
    expect(result.skippedReason).toBe('pref_disabled');
  });

  it('no push_token: creates in-app record but does NOT send push', async () => {
    mockProfileFetch({
      push_token: null,
      notification_preferences: {
        courses: true,
        trajets: true,
        hebergements: true,
        promotions: true,
        messages: true,
      },
    });
    (createNotification as jest.Mock).mockResolvedValue(true);

    const result = await sendPushIfAllowed({
      recipientProfileId: 'profile-uuid-1',
      category: 'trajets',
      type: 'foo',
      title: 'x',
      body: 'y',
    });

    expect(createNotification).toHaveBeenCalledTimes(1);
    expect(sendPushNotification).not.toHaveBeenCalled();
    expect(result.inAppCreated).toBe(true);
    expect(result.pushSent).toBe(false);
    expect(result.skippedReason).toBe('no_token');
  });

  it('profile not found: returns skippedReason profile_not_found, no side-effects', async () => {
    mockProfileFetch(null);

    const result = await sendPushIfAllowed({
      recipientProfileId: 'missing-id',
      category: 'trajets',
      type: 'foo',
      title: 'x',
      body: 'y',
    });

    expect(createNotification).not.toHaveBeenCalled();
    expect(sendPushNotification).not.toHaveBeenCalled();
    expect(result.inAppCreated).toBe(false);
    expect(result.pushSent).toBe(false);
    expect(result.skippedReason).toBe('profile_not_found');
  });

  it('createInAppRecord=false: skips in-app but still sends push (chat case)', async () => {
    mockProfileFetch({
      push_token: 'ExponentPushToken[abc]',
      notification_preferences: {
        courses: true,
        trajets: true,
        hebergements: true,
        promotions: true,
        messages: true,
      },
    });
    (sendPushNotification as jest.Mock).mockResolvedValue(true);

    const result = await sendPushIfAllowed({
      recipientProfileId: 'profile-uuid-1',
      category: 'messages',
      type: 'direct_message',
      title: 'Alice',
      body: 'Hello!',
      createInAppRecord: false,
    });

    expect(createNotification).not.toHaveBeenCalled();
    expect(sendPushNotification).toHaveBeenCalledTimes(1);
    expect(result.inAppCreated).toBe(false);
    expect(result.pushSent).toBe(true);
  });

  it('respectPreferences=false: sends push even if category muted', async () => {
    mockProfileFetch({
      push_token: 'ExponentPushToken[abc]',
      notification_preferences: {
        courses: true,
        trajets: false,
        hebergements: true,
        promotions: true,
        messages: true,
      },
    });
    (createNotification as jest.Mock).mockResolvedValue(true);
    (sendPushNotification as jest.Mock).mockResolvedValue(true);

    const result = await sendPushIfAllowed({
      recipientProfileId: 'profile-uuid-1',
      category: 'trajets',
      type: 'urgent',
      title: 'x',
      body: 'y',
      respectPreferences: false,
    });

    expect(sendPushNotification).toHaveBeenCalledTimes(1);
    expect(result.pushSent).toBe(true);
    expect(result.skippedReason).toBeUndefined();
  });

  it('does not throw on unexpected errors', async () => {
    (supabase.from as jest.Mock).mockImplementation(() => {
      throw new Error('boom');
    });

    const result = await sendPushIfAllowed({
      recipientProfileId: 'x',
      category: 'trajets',
      type: 'y',
      title: 'z',
      body: 'w',
    });

    expect(result.skippedReason).toBe('error');
    expect(result.inAppCreated).toBe(false);
    expect(result.pushSent).toBe(false);
  });
});

describe('sendPushBroadcast', () => {
  it('invokes the send-push Edge Function with the expected payload', async () => {
    const invokeMock = jest.fn().mockResolvedValue({ data: { sent: 3 }, error: null });
    (supabase as unknown as { functions: { invoke: jest.Mock } }).functions = {
      invoke: invokeMock,
    };

    const result = await sendPushBroadcast({
      category: 'trajets',
      recipientRole: 'client',
      title: 'Nouveau trajet',
      message: 'Libreville → Port-Gentil',
      data: { trajetId: 't1' },
    });

    expect(invokeMock).toHaveBeenCalledWith('send-push', {
      body: expect.objectContaining({
        category: 'trajets',
        recipientRole: 'client',
        title: 'Nouveau trajet',
        message: 'Libreville → Port-Gentil',
        data: { trajetId: 't1' },
      }),
    });
    expect(result.invoked).toBe(true);
  });

  it('returns invoked=false with error message when the function errors', async () => {
    const invokeMock = jest
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'nope' } });
    (supabase as unknown as { functions: { invoke: jest.Mock } }).functions = {
      invoke: invokeMock,
    };

    const result = await sendPushBroadcast({
      category: 'trajets',
      recipientRole: 'client',
      title: 't',
      message: 'm',
    });

    expect(result.invoked).toBe(false);
    expect(result.error).toBe('nope');
  });
});
