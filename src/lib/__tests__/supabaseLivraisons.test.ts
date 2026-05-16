jest.unmock('../supabaseLivraisons');

import { supabase } from '../supabase';
import {
  insertLivraison,
  fetchLivraisonsForClient,
  fetchLivraisonsForLivreur,
  fetchLivraisonById,
  acceptLivraison,
  refuseLivraison,
  markLivraisonEnCours,
  markLivraisonLivree,
  cancelLivraison,
} from '../supabaseLivraisons';

function chain(resolved: { data: unknown; error: unknown }) {
  const c: Record<string, jest.Mock> & { then?: jest.Mock } = {};
  for (const m of ['select', 'insert', 'update', 'eq', 'in', 'or', 'order', 'limit', 'single']) {
    c[m] = jest.fn().mockReturnValue(c);
  }
  c.then = jest.fn((res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
    Promise.resolve(resolved).then(res, rej)
  );
  return c;
}

const baseRow = {
  id: 'l-1',
  client_id: 'c1',
  livreur_id: 'lv1',
  pickup_location: 'Place A',
  dropoff_location: 'Place B',
  pickup_lat: null,
  pickup_lng: null,
  dropoff_lat: null,
  dropoff_lng: null,
  description: null,
  prix_estime: 5000,
  status: 'en_attente' as const,
  accepted_at: null,
  picked_up_at: null,
  delivered_at: null,
  cancelled_at: null,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

describe('insertLivraison', () => {
  it('inserts with status=en_attente and sanitises strings', async () => {
    const c = chain({ data: { ...baseRow, pickup_location: 'Place A', dropoff_location: 'Place B' }, error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);

    const out = await insertLivraison({
      client_id: 'c1',
      livreur_id: 'lv1',
      pickup_location: '  Place A  ',
      dropoff_location: '  Place B  ',
      description: '  pkg desc  ',
    });

    expect(out?.id).toBe('l-1');
    const payload = c.insert.mock.calls[0][0];
    expect(payload.status).toBe('en_attente');
    expect(payload.pickup_location).toBe('Place A');
    expect(payload.dropoff_location).toBe('Place B');
    expect(payload.description).toBe('pkg desc');
  });

  it('rejects invalid location without hitting supabase', async () => {
    const c = chain({ data: null, error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);

    const out = await insertLivraison({
      client_id: 'c1',
      livreur_id: 'lv1',
      pickup_location: '<><><',  // invalid characters
      dropoff_location: 'Place B',
    });

    expect(out).toBeNull();
  });

  it('rejects description > 500 chars', async () => {
    const c = chain({ data: null, error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);

    const out = await insertLivraison({
      client_id: 'c1',
      livreur_id: 'lv1',
      pickup_location: 'Place A',
      dropoff_location: 'Place B',
      description: 'x'.repeat(501),
    });

    expect(out).toBeNull();
    expect(c.insert).not.toHaveBeenCalled();
  });

  it('returns null on supabase error', async () => {
    const c = chain({ data: null, error: { code: 'PGRST301', message: 'rls' } });
    (supabase.from as jest.Mock).mockReturnValue(c);

    const out = await insertLivraison({
      client_id: 'c1',
      livreur_id: 'lv1',
      pickup_location: 'Place A',
      dropoff_location: 'Place B',
    });
    expect(out).toBeNull();
  });
});

describe('fetchLivraisonsForClient / Livreur', () => {
  it('client query filters on client_id', async () => {
    const c = chain({ data: [baseRow], error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);

    const out = await fetchLivraisonsForClient('c1');
    expect(out).toHaveLength(1);
    expect(c.eq).toHaveBeenCalledWith('client_id', 'c1');
    expect(c.order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('livreur query filters on livreur_id', async () => {
    const c = chain({ data: [baseRow], error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);

    await fetchLivraisonsForLivreur('lv1');
    expect(c.eq).toHaveBeenCalledWith('livreur_id', 'lv1');
  });

  it('returns [] on error', async () => {
    const c = chain({ data: null, error: { message: 'x' } });
    (supabase.from as jest.Mock).mockReturnValue(c);
    expect(await fetchLivraisonsForClient('c1')).toEqual([]);
  });
});

describe('fetchLivraisonById', () => {
  it('returns null when not found', async () => {
    const c = chain({ data: null, error: { code: 'PGRST116' } });
    (supabase.from as jest.Mock).mockReturnValue(c);
    expect(await fetchLivraisonById('missing')).toBeNull();
  });

  it('maps the row when found', async () => {
    const c = chain({ data: baseRow, error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);

    const out = await fetchLivraisonById('l-1');
    expect(out?.id).toBe('l-1');
    expect(out?.pickupLocation).toBe('Place A');
  });
});

describe('status transitions — F3-style guards', () => {
  it('acceptLivraison guards on en_attente + sets accepted_at', async () => {
    const c = chain({ data: [{ id: 'l-1' }], error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);

    const ok = await acceptLivraison('l-1');
    expect(ok).toBe(true);
    const payload = c.update.mock.calls[0][0];
    expect(payload.status).toBe('acceptee');
    expect(payload.accepted_at).toBeDefined();
    expect(c.eq).toHaveBeenCalledWith('status', 'en_attente');
  });

  it('acceptLivraison returns false when guard rejects (already cancelled)', async () => {
    const c = chain({ data: [], error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);
    expect(await acceptLivraison('l-1')).toBe(false);
  });

  it('refuseLivraison guards on en_attente', async () => {
    const c = chain({ data: [{ id: 'l-1' }], error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);

    await refuseLivraison('l-1');
    expect(c.eq).toHaveBeenCalledWith('status', 'en_attente');
  });

  it('markLivraisonEnCours guards on acceptee + sets picked_up_at', async () => {
    const c = chain({ data: [{ id: 'l-1' }], error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);

    await markLivraisonEnCours('l-1');
    const payload = c.update.mock.calls[0][0];
    expect(payload.status).toBe('en_cours');
    expect(payload.picked_up_at).toBeDefined();
    expect(c.eq).toHaveBeenCalledWith('status', 'acceptee');
  });

  it('markLivraisonLivree guards on en_cours + sets delivered_at', async () => {
    const c = chain({ data: [{ id: 'l-1' }], error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);

    await markLivraisonLivree('l-1');
    const payload = c.update.mock.calls[0][0];
    expect(payload.status).toBe('livree');
    expect(payload.delivered_at).toBeDefined();
    expect(c.eq).toHaveBeenCalledWith('status', 'en_cours');
  });

  it('cancelLivraison allows in {en_attente,acceptee,en_cours} via .in()', async () => {
    const c = chain({ data: [{ id: 'l-1' }], error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);

    await cancelLivraison('l-1');
    const payload = c.update.mock.calls[0][0];
    expect(payload.status).toBe('annulee');
    expect(payload.cancelled_at).toBeDefined();
    expect(c.in).toHaveBeenCalledWith('status', ['en_attente', 'acceptee', 'en_cours']);
  });

  it('cancelLivraison returns false when guard rejects (already livrée)', async () => {
    const c = chain({ data: [], error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);
    expect(await cancelLivraison('l-1')).toBe(false);
  });

  it('returns false on supabase error', async () => {
    const c = chain({ data: null, error: { message: 'boom' } });
    (supabase.from as jest.Mock).mockReturnValue(c);
    expect(await acceptLivraison('l-1')).toBe(false);
  });
});
