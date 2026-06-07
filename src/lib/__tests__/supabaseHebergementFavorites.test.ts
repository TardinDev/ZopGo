jest.unmock('../supabaseHebergementFavorites');

import { supabase } from '../supabase';
import {
  fetchFavoriteIds,
  addFavorite,
  removeFavorite,
  fetchFavoriteHebergements,
} from '../supabaseHebergementFavorites';

function chain(resolved: { data?: unknown; error: unknown }) {
  const c: Record<string, jest.Mock> & { then?: jest.Mock } = {};
  for (const m of ['select', 'insert', 'delete', 'eq', 'order']) {
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

describe('fetchFavoriteIds', () => {
  it('returns the hebergement_id list', async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      chain({ data: [{ hebergement_id: 'h1' }, { hebergement_id: 'h2' }], error: null })
    );
    expect(await fetchFavoriteIds('c1')).toEqual(['h1', 'h2']);
  });

  it('returns [] on error', async () => {
    (supabase.from as jest.Mock).mockReturnValue(chain({ data: null, error: { message: 'x' } }));
    expect(await fetchFavoriteIds('c1')).toEqual([]);
  });
});

describe('addFavorite / removeFavorite', () => {
  it('addFavorite inserts and returns true', async () => {
    const c = chain({ error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);
    expect(await addFavorite('c1', 'h1')).toBe(true);
    expect(c.insert).toHaveBeenCalledWith({ client_id: 'c1', hebergement_id: 'h1' });
  });

  it('removeFavorite deletes scoped to client + listing', async () => {
    const c = chain({ error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);
    expect(await removeFavorite('c1', 'h1')).toBe(true);
    expect(c.delete).toHaveBeenCalled();
    expect(c.eq).toHaveBeenCalledWith('client_id', 'c1');
    expect(c.eq).toHaveBeenCalledWith('hebergement_id', 'h1');
  });

  it('returns false on error', async () => {
    (supabase.from as jest.Mock).mockReturnValue(chain({ error: { message: 'rls' } }));
    expect(await addFavorite('c1', 'h1')).toBe(false);
  });
});

describe('fetchFavoriteHebergements', () => {
  it('maps active joined listings and drops inactive/missing ones', async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      chain({
        data: [
          {
            hebergement_id: 'h1',
            hebergement: {
              id: 'h1',
              nom: 'Villa',
              type: 'maison',
              ville: 'Libreville',
              adresse: 'rue',
              prix_par_nuit: 40000,
              periode_tarif: 'mois',
              capacite: 6,
              disponibilite: 2,
              description: 'Belle villa',
              images: ['a.jpg'],
              amenities: ['wifi'],
              hebergeur_id: 'hb1',
              status: 'actif',
              profiles: { name: 'Awa', avatar: 'av.png', rating: 4.8 },
            },
          },
          {
            hebergement_id: 'h2',
            hebergement: {
              id: 'h2',
              nom: 'Inactif',
              type: 'hotel',
              ville: 'PG',
              adresse: '',
              prix_par_nuit: 10000,
              capacite: 1,
              disponibilite: 0,
              description: '',
              images: [],
              amenities: [],
              hebergeur_id: 'hb2',
              status: 'inactif',
              profiles: null,
            },
          },
          { hebergement_id: 'h3', hebergement: null },
        ],
        error: null,
      })
    );

    const out = await fetchFavoriteHebergements('c1');
    expect(out).toHaveLength(1);
    expect(out[0].supabaseId).toBe('h1');
    expect(out[0].type).toBe('Maison');
    expect(out[0].amenities).toEqual(['wifi']);
    expect(out[0].hebergeurName).toBe('Awa');
    expect(out[0].periodeTarif).toBe('mois');
    expect(out[0].price).toBe('40000 FCFA/mois');
  });
});
