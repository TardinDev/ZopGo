jest.unmock('../supabaseProfile');

import { supabase } from '../supabase';
import {
  fetchProfileByClerkId,
  upsertProfile,
  updateProfile,
  getEffectiveRoles,
  buildDefaultRoles,
} from '../supabaseProfile';

function chain(resolved: { data: unknown; error: unknown }) {
  const c: Record<string, jest.Mock> & { then?: jest.Mock } = {};
  for (const m of ['select', 'insert', 'update', 'upsert', 'delete', 'eq', 'single']) {
    c[m] = jest.fn().mockReturnValue(c);
  }
  c.then = jest.fn((res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
    Promise.resolve(resolved).then(res, rej)
  );
  return c;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

describe('fetchProfileByClerkId', () => {
  it('returns the profile when found', async () => {
    const c = chain({ data: { id: 'p-1', clerk_id: 'clk_1', role: 'client' }, error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);

    const out = await fetchProfileByClerkId('clk_1');
    expect(out?.id).toBe('p-1');
    expect(c.eq).toHaveBeenCalledWith('clerk_id', 'clk_1');
  });

  it('returns null + does NOT log on PGRST116 (first-login)', async () => {
    const c = chain({ data: null, error: { code: 'PGRST116', message: 'no rows' } });
    (supabase.from as jest.Mock).mockReturnValue(c);

    const out = await fetchProfileByClerkId('clk_new');
    expect(out).toBeNull();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('returns null + logs on non-PGRST116 errors', async () => {
    const c = chain({ data: null, error: { code: 'PGRST301', message: 'jwt rejected' } });
    (supabase.from as jest.Mock).mockReturnValue(c);

    const out = await fetchProfileByClerkId('clk_1');
    expect(out).toBeNull();
    expect(console.warn).toHaveBeenCalled();
  });
});

describe('upsertProfile', () => {
  it('upserts onConflict clerk_id and sanitises name + email', async () => {
    const c = chain({ data: { id: 'p-1', clerk_id: 'clk_1' }, error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);

    const out = await upsertProfile('clk_1', {
      role: 'client',
      name: '  Alice  ',
      email: '  Alice@example.com  ',
    });

    expect(out?.id).toBe('p-1');
    const upsertCall = c.upsert.mock.calls[0];
    expect(upsertCall[0]).toMatchObject({
      clerk_id: 'clk_1',
      role: 'client',
      name: 'Alice',
      email: 'Alice@example.com',
    });
    expect(upsertCall[1]).toEqual({ onConflict: 'clerk_id' });
  });

  it('uses empty defaults for optional fields', async () => {
    const c = chain({ data: { id: 'p-1' }, error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);

    await upsertProfile('clk_2', { role: 'chauffeur', name: 'Bob', email: 'bob@x.com' });

    const payload = c.upsert.mock.calls[0][0];
    expect(payload.phone).toBe('');
    expect(payload.avatar).toBe('');
    expect(payload.address).toBe('');
    expect(payload.disponible).toBe(false);
  });

  it('defaults roles to [all three] regardless of the picked active role (migration 024)', async () => {
    const c = chain({ data: { id: 'p-1' }, error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);

    await upsertProfile('clk_3', { role: 'chauffeur', name: 'Bob', email: 'bob@x.com' });

    const payload = c.upsert.mock.calls[0][0];
    expect(payload.roles).toEqual(['client', 'chauffeur', 'hebergeur']);
  });

  it('grants all three roles even when the user signs up as a plain client', async () => {
    const c = chain({ data: { id: 'p-1' }, error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);

    await upsertProfile('clk_4', { role: 'client', name: 'A', email: 'a@x.com' });

    const payload = c.upsert.mock.calls[0][0];
    expect(payload.roles).toEqual(['client', 'chauffeur', 'hebergeur']);
  });

  it('honours an explicit roles override', async () => {
    const c = chain({ data: { id: 'p-1' }, error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);

    await upsertProfile('clk_5', {
      role: 'chauffeur',
      name: 'C',
      email: 'c@x.com',
      roles: ['client', 'chauffeur', 'hebergeur'],
    });

    const payload = c.upsert.mock.calls[0][0];
    expect(payload.roles).toEqual(['client', 'chauffeur', 'hebergeur']);
  });

  it('throws on supabase error so caller can surface it', async () => {
    const c = chain({ data: null, error: { code: 'PGRST301', message: 'boom', details: '' } });
    (supabase.from as jest.Mock).mockReturnValue(c);

    await expect(
      upsertProfile('clk_x', { role: 'client', name: 'X', email: 'x@x.com' })
    ).rejects.toThrow('boom');
  });
});

describe('updateProfile', () => {
  it('updates and sanitises name', async () => {
    const c = chain({ data: null, error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);

    const ok = await updateProfile('clk_1', { name: '  New Name  ', phone: '+241...' });

    expect(ok).toBe(true);
    const payload = c.update.mock.calls[0][0];
    expect(payload.name).toBe('New Name');
    expect(payload.phone).toBe('+241...');
    expect(c.eq).toHaveBeenCalledWith('clerk_id', 'clk_1');
  });

  it('returns false on error', async () => {
    const c = chain({ data: null, error: { message: 'rls' } });
    (supabase.from as jest.Mock).mockReturnValue(c);

    const ok = await updateProfile('clk_1', { name: 'X' });
    expect(ok).toBe(false);
  });

  it('does not touch name when not provided', async () => {
    const c = chain({ data: null, error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);

    await updateProfile('clk_1', { rating: 4.5, total_trips: 10 });

    const payload = c.update.mock.calls[0][0];
    expect(payload.name).toBeUndefined();
    expect(payload.rating).toBe(4.5);
    expect(payload.total_trips).toBe(10);
  });

  it('persists the active role for the in-app mode switcher', async () => {
    const c = chain({ data: null, error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);

    const ok = await updateProfile('clk_switch', { role: 'chauffeur' });

    expect(ok).toBe(true);
    const payload = c.update.mock.calls[0][0];
    expect(payload.role).toBe('chauffeur');
    expect(c.eq).toHaveBeenCalledWith('clerk_id', 'clk_switch');
  });
});

describe('getEffectiveRoles', () => {
  it('uses the roles[] column when present', () => {
    expect(
      getEffectiveRoles({ roles: ['client', 'chauffeur'], role: 'chauffeur' })
    ).toEqual(['client', 'chauffeur']);
  });

  it('falls back to [role] when roles is null (pre-migration row)', () => {
    expect(getEffectiveRoles({ roles: null, role: 'hebergeur' })).toEqual([
      'hebergeur',
    ]);
  });

  it('falls back to [role] when roles is empty', () => {
    expect(getEffectiveRoles({ roles: [], role: 'client' })).toEqual(['client']);
  });

  it('drops unknown role values defensively', () => {
    expect(
      getEffectiveRoles({ roles: ['client', 'admin', 'chauffeur'], role: 'client' })
    ).toEqual(['client', 'chauffeur']);
  });

  it('deduplicates', () => {
    expect(
      getEffectiveRoles({ roles: ['client', 'client', 'chauffeur'], role: 'client' })
    ).toEqual(['client', 'chauffeur']);
  });

  it('returns [] for null/undefined profile', () => {
    expect(getEffectiveRoles(null)).toEqual([]);
    expect(getEffectiveRoles(undefined)).toEqual([]);
  });
});

describe('buildDefaultRoles (migration 024 — all roles for everyone)', () => {
  it('returns all three roles regardless of the active role at signup', () => {
    expect(buildDefaultRoles('client')).toEqual(['client', 'chauffeur', 'hebergeur']);
    expect(buildDefaultRoles('chauffeur')).toEqual(['client', 'chauffeur', 'hebergeur']);
    expect(buildDefaultRoles('hebergeur')).toEqual(['client', 'chauffeur', 'hebergeur']);
  });

  it('also returns all three when called without an active role', () => {
    expect(buildDefaultRoles()).toEqual(['client', 'chauffeur', 'hebergeur']);
  });

  it('is stable across calls (does not mutate)', () => {
    const a = buildDefaultRoles('client');
    const b = buildDefaultRoles('chauffeur');
    expect(a).toEqual(b);
    // Different array instances so callers can mutate freely if needed.
    expect(a).not.toBe(b);
  });
});
