jest.unmock('../supabaseProfile');

import { supabase } from '../supabase';
import {
  fetchProfileByClerkId,
  upsertProfile,
  updateProfile,
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
});
