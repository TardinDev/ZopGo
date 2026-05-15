// Tests for the F3 reservation status flow helpers added to supabaseReservations.
// We mock the supabase client to verify each helper calls the right table,
// uses the right .eq() guards, and returns a sensible boolean.

jest.unmock('../supabaseReservations');

import { supabase } from '../supabase';
import {
  updateReservationStatus,
  cancelReservationByClient,
  expireStaleReservations,
  markReservationReviewed,
} from '../supabaseReservations';

interface MockChain {
  [key: string]: jest.Mock;
}

function chain(resolved: { data: unknown; error: unknown }): MockChain & {
  then: jest.Mock;
} {
  const c: MockChain & { then?: jest.Mock } = {};
  const methods = ['select', 'update', 'eq', 'lt', 'in', 'or', 'order', 'limit', 'single', 'maybeSingle'];
  for (const m of methods) {
    c[m] = jest.fn().mockReturnValue(c);
  }
  c.then = jest.fn((res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
    Promise.resolve(resolved).then(res, rej)
  );
  return c as MockChain & { then: jest.Mock };
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('updateReservationStatus', () => {
  it('writes started_at + en_attente precursor guard when transitioning to en_route', async () => {
    const c = chain({ data: [{ id: 'r-1' }], error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);

    const ok = await updateReservationStatus('r-1', 'en_route');

    expect(ok).toBe(true);
    expect(supabase.from).toHaveBeenCalledWith('reservations');
    const updatePayload = c.update.mock.calls[0][0];
    expect(updatePayload.status).toBe('en_route');
    expect(updatePayload.started_at).toBeDefined();
    expect(updatePayload.completed_at).toBeUndefined();
    expect(c.eq).toHaveBeenCalledWith('id', 'r-1');
    // Precursor guard: en_route is only reachable from acceptee
    expect(c.eq).toHaveBeenCalledWith('status', 'acceptee');
  });

  it('writes completed_at + arrivee precursor guard when transitioning to terminee', async () => {
    const c = chain({ data: [{ id: 'r-1' }], error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);

    await updateReservationStatus('r-1', 'terminee');

    const payload = c.update.mock.calls[0][0];
    expect(payload.completed_at).toBeDefined();
    expect(c.eq).toHaveBeenCalledWith('status', 'arrivee');
  });

  it('does not set timestamps for arrivee but enforces en_route precursor', async () => {
    const c = chain({ data: [{ id: 'r-1' }], error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);

    await updateReservationStatus('r-1', 'arrivee');

    const payload = c.update.mock.calls[0][0];
    expect(payload.started_at).toBeUndefined();
    expect(payload.completed_at).toBeUndefined();
    expect(c.eq).toHaveBeenCalledWith('status', 'en_route');
  });

  it('returns false when the precursor guard rejects (out-of-order tap)', async () => {
    const c = chain({ data: [], error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);

    const ok = await updateReservationStatus('r-1', 'terminee');
    expect(ok).toBe(false);
  });

  it('returns false when supabase errors', async () => {
    const c = chain({ data: null, error: { message: 'boom' } });
    (supabase.from as jest.Mock).mockReturnValue(c);

    const ok = await updateReservationStatus('r-1', 'en_route');
    expect(ok).toBe(false);
  });
});

describe('cancelReservationByClient', () => {
  it('guards the update with status=en_attente', async () => {
    const c = chain({ data: [{ id: 'r-1' }], error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);

    const ok = await cancelReservationByClient('r-1');

    expect(ok).toBe(true);
    expect(c.update).toHaveBeenCalledWith({ status: 'annulee' });
    // Two .eq calls: id + status=en_attente
    const calls = c.eq.mock.calls;
    expect(calls).toContainEqual(['id', 'r-1']);
    expect(calls).toContainEqual(['status', 'en_attente']);
  });

  it('returns false when no row was updated (guard rejected)', async () => {
    const c = chain({ data: [], error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);

    const ok = await cancelReservationByClient('r-1');
    expect(ok).toBe(false);
  });

  it('returns false on db error', async () => {
    const c = chain({ data: null, error: { message: 'rls' } });
    (supabase.from as jest.Mock).mockReturnValue(c);

    const ok = await cancelReservationByClient('r-1');
    expect(ok).toBe(false);
  });
});

describe('expireStaleReservations', () => {
  it('queries rows older than 5 minutes by default', async () => {
    const c = chain({ data: [{ id: 'r-1' }, { id: 'r-2' }], error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);

    const count = await expireStaleReservations();

    expect(count).toBe(2);
    expect(c.update).toHaveBeenCalledWith({ status: 'expiree' });
    expect(c.eq).toHaveBeenCalledWith('status', 'en_attente');
    expect(c.lt).toHaveBeenCalledWith('created_at', expect.any(String));
    // Verify the cutoff is roughly 5 minutes ago.
    const cutoff = new Date(c.lt.mock.calls[0][1]).getTime();
    const diff = Date.now() - cutoff;
    expect(diff).toBeGreaterThanOrEqual(5 * 60 * 1000 - 1000);
    expect(diff).toBeLessThanOrEqual(5 * 60 * 1000 + 1000);
  });

  it('honours a custom ageMs', async () => {
    const c = chain({ data: [], error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);

    await expireStaleReservations(60_000);

    const cutoff = new Date(c.lt.mock.calls[0][1]).getTime();
    const diff = Date.now() - cutoff;
    expect(diff).toBeGreaterThanOrEqual(59_000);
    expect(diff).toBeLessThanOrEqual(61_000);
  });

  it('returns 0 on error', async () => {
    const c = chain({ data: null, error: { message: 'rls' } });
    (supabase.from as jest.Mock).mockReturnValue(c);

    const count = await expireStaleReservations();
    expect(count).toBe(0);
  });
});

describe('markReservationReviewed', () => {
  it('sets reviewed=true', async () => {
    const c = chain({ data: null, error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);

    const ok = await markReservationReviewed('r-1');

    expect(ok).toBe(true);
    expect(c.update).toHaveBeenCalledWith({ reviewed: true });
    expect(c.eq).toHaveBeenCalledWith('id', 'r-1');
  });
});
