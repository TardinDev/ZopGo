jest.unmock('../supabaseHebergementReservations');

import { supabase } from '../supabase';
import {
  insertHebergementReservation,
  acceptHebergementReservation,
  refuseHebergementReservation,
  fetchHebergementReservationsForClient,
  fetchHebergementReservationsForHebergeur,
  fetchHebergementReservationContexts,
} from '../supabaseHebergementReservations';

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
  id: 'r-1',
  hebergement_id: 'h-1',
  client_id: 'c-1',
  hebergeur_id: 'hb-1',
  nombre_nuits: 2,
  nombre_voyageurs: 3,
  date_arrivee: '2026-06-12',
  date_depart: '2026-06-14',
  prix_total: 30000,
  status: 'en_attente' as const,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('insertHebergementReservation', () => {
  it('inserts with status=en_attente', async () => {
    const c = chain({ data: baseRow, error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);

    const out = await insertHebergementReservation({
      hebergement_id: 'h-1',
      client_id: 'c-1',
      hebergeur_id: 'hb-1',
      nombre_nuits: 2,
      nombre_voyageurs: 3,
      date_arrivee: '2026-06-12',
      date_depart: '2026-06-14',
      prix_total: 30000,
    });

    expect(out?.id).toBe('r-1');
    expect(out?.nombreNuits).toBe(2);
    expect(out?.nombreVoyageurs).toBe(3);
    expect(out?.dateArrivee).toBe('2026-06-12');
    expect(out?.dateDepart).toBe('2026-06-14');
    const payload = c.insert.mock.calls[0][0];
    expect(payload.status).toBe('en_attente');
    expect(payload.nombre_voyageurs).toBe(3);
    expect(payload.date_arrivee).toBe('2026-06-12');
  });

  it('returns null on error', async () => {
    const c = chain({ data: null, error: { message: 'rls' } });
    (supabase.from as jest.Mock).mockReturnValue(c);

    const out = await insertHebergementReservation({
      hebergement_id: 'h-1',
      client_id: 'c-1',
      hebergeur_id: 'hb-1',
      nombre_nuits: 1,
      nombre_voyageurs: 1,
      prix_total: 15000,
    });
    expect(out).toBeNull();
  });
});

describe('accept/refuseHebergementReservation — race guard', () => {
  it('accept guards on status=en_attente', async () => {
    const c = chain({ data: [{ id: 'r-1' }], error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);

    const ok = await acceptHebergementReservation('r-1');
    expect(ok).toBe(true);
    expect(c.update).toHaveBeenCalledWith({ status: 'acceptee' });
    expect(c.eq).toHaveBeenCalledWith('id', 'r-1');
    expect(c.eq).toHaveBeenCalledWith('status', 'en_attente');
  });

  it('accept returns false when guard rejects (already cancelled)', async () => {
    const c = chain({ data: [], error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);
    expect(await acceptHebergementReservation('r-1')).toBe(false);
  });

  it('refuse guards on status=en_attente', async () => {
    const c = chain({ data: [{ id: 'r-1' }], error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);

    await refuseHebergementReservation('r-1');
    expect(c.update).toHaveBeenCalledWith({ status: 'refusee' });
    expect(c.eq).toHaveBeenCalledWith('status', 'en_attente');
  });

  it('refuse returns false on supabase error', async () => {
    const c = chain({ data: null, error: { message: 'boom' } });
    (supabase.from as jest.Mock).mockReturnValue(c);
    expect(await refuseHebergementReservation('r-1')).toBe(false);
  });
});

describe('fetch by side', () => {
  it('client side filters on client_id', async () => {
    const c = chain({ data: [baseRow], error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);
    const out = await fetchHebergementReservationsForClient('c-1');
    expect(out).toHaveLength(1);
    expect(c.eq).toHaveBeenCalledWith('client_id', 'c-1');
  });

  it('hebergeur side filters on hebergeur_id', async () => {
    const c = chain({ data: [baseRow], error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);
    await fetchHebergementReservationsForHebergeur('hb-1');
    expect(c.eq).toHaveBeenCalledWith('hebergeur_id', 'hb-1');
  });

  it('returns [] on error', async () => {
    const c = chain({ data: null, error: { message: 'x' } });
    (supabase.from as jest.Mock).mockReturnValue(c);
    expect(await fetchHebergementReservationsForClient('c-1')).toEqual([]);
  });
});

describe('fetchHebergementReservationContexts', () => {
  it('returns {} for an empty input without hitting supabase', async () => {
    expect(await fetchHebergementReservationContexts([])).toEqual({});
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('shapes the result keyed by id', async () => {
    const c = chain({
      data: [
        { id: 'r-1', hebergement: { nom: 'Hotel A', ville: 'Libreville' } },
        { id: 'r-2', hebergement: { nom: 'Hotel B', ville: 'Port-Gentil' } },
      ],
      error: null,
    });
    (supabase.from as jest.Mock).mockReturnValue(c);

    const out = await fetchHebergementReservationContexts(['r-1', 'r-2']);
    expect(out).toEqual({
      'r-1': { hebergementNom: 'Hotel A', hebergementVille: 'Libreville' },
      'r-2': { hebergementNom: 'Hotel B', hebergementVille: 'Port-Gentil' },
    });
  });

  it('skips rows where the join returned partial data', async () => {
    const c = chain({
      data: [
        { id: 'r-1', hebergement: { nom: 'Hotel A', ville: 'Libreville' } },
        { id: 'r-2', hebergement: null },
        { id: 'r-3', hebergement: { nom: 'Hotel C', ville: '' } },
      ],
      error: null,
    });
    (supabase.from as jest.Mock).mockReturnValue(c);

    const out = await fetchHebergementReservationContexts(['r-1', 'r-2', 'r-3']);
    expect(Object.keys(out)).toEqual(['r-1']);
  });
});
