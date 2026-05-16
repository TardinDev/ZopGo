jest.unmock('../supabaseNotifications');

import { supabase } from '../supabase';
import {
  updatePushToken,
  updateNotificationPreferences,
  fetchNotificationPreferences,
  DEFAULT_PREFS,
} from '../supabaseNotifications';

function chain(resolved: { data: unknown; error: unknown }) {
  const c: Record<string, jest.Mock> & { then?: jest.Mock } = {};
  for (const m of ['select', 'update', 'eq', 'single']) {
    c[m] = jest.fn().mockReturnValue(c);
  }
  c.then = jest.fn((res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
    Promise.resolve(resolved).then(res, rej)
  );
  return c;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('updatePushToken', () => {
  it('updates the token scoped by clerk_id', async () => {
    const c = chain({ data: null, error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);

    const ok = await updatePushToken('clk_1', 'ExponentPushToken[abc]');
    expect(ok).toBe(true);
    expect(c.update).toHaveBeenCalledWith({ push_token: 'ExponentPushToken[abc]' });
    expect(c.eq).toHaveBeenCalledWith('clerk_id', 'clk_1');
  });

  it('clears the token when null is passed (logout)', async () => {
    const c = chain({ data: null, error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);

    await updatePushToken('clk_1', null);
    expect(c.update).toHaveBeenCalledWith({ push_token: null });
  });

  it('returns false on error', async () => {
    const c = chain({ data: null, error: { message: 'rls' } });
    (supabase.from as jest.Mock).mockReturnValue(c);
    expect(await updatePushToken('clk_1', 'x')).toBe(false);
  });
});

describe('updateNotificationPreferences', () => {
  it('persists the whole prefs object', async () => {
    const c = chain({ data: null, error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);

    const prefs = { ...DEFAULT_PREFS, promotions: false };
    const ok = await updateNotificationPreferences('clk_1', prefs);

    expect(ok).toBe(true);
    expect(c.update).toHaveBeenCalledWith({ notification_preferences: prefs });
  });

  it('returns false on error', async () => {
    const c = chain({ data: null, error: { message: 'rls' } });
    (supabase.from as jest.Mock).mockReturnValue(c);
    expect(await updateNotificationPreferences('clk_1', DEFAULT_PREFS)).toBe(false);
  });
});

describe('fetchNotificationPreferences', () => {
  it('returns the stored prefs when present', async () => {
    const stored = { ...DEFAULT_PREFS, hebergements: false };
    const c = chain({ data: { notification_preferences: stored }, error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);

    const out = await fetchNotificationPreferences('clk_1');
    expect(out).toEqual(stored);
  });

  it('falls back to DEFAULT_PREFS when the row has no prefs', async () => {
    const c = chain({ data: { notification_preferences: null }, error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);

    expect(await fetchNotificationPreferences('clk_1')).toEqual(DEFAULT_PREFS);
  });

  it('falls back to DEFAULT_PREFS on error (so the app never sits without prefs)', async () => {
    const c = chain({ data: null, error: { message: 'rls' } });
    (supabase.from as jest.Mock).mockReturnValue(c);

    expect(await fetchNotificationPreferences('clk_1')).toEqual(DEFAULT_PREFS);
  });

  it('DEFAULT_PREFS sets every category to true (opt-out model)', () => {
    expect(DEFAULT_PREFS).toEqual({
      courses: true,
      trajets: true,
      hebergements: true,
      promotions: true,
      messages: true,
    });
  });
});
