// Unmock this module so we test the real implementation
jest.unmock('../supabaseTrajets');

import { supabase } from '../supabase';
import {
  fetchTrajets,
  insertTrajet,
  fetchAllAvailableTrajets,
  deleteTrajet,
  markTrajetEffectue,
} from '../supabaseTrajets';

// Create a fully chainable mock where every method returns the chain itself,
// and the chain is a thenable that resolves to the configured value.
function createMockChain(resolvedValue: { data: unknown; error: unknown }) {
  let result = resolvedValue;
  const chain: Record<string, jest.Mock> & { then?: jest.Mock } = {};
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'gt', 'or', 'order', 'limit', 'single'];
  methods.forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  // Make the chain itself a thenable (awaitable)
  chain.then = jest.fn((resolve, reject) => {
    return Promise.resolve(result).then(resolve, reject);
  });
  return chain;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('supabaseTrajets', () => {
  describe('fetchTrajets', () => {
    it('fetches trajets for a chauffeur', async () => {
      const mockChain = createMockChain({
        data: [{ id: 't1', chauffeur_id: 'c1', ville_depart: 'A', ville_arrivee: 'B' }],
        error: null,
      });
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await fetchTrajets('c1');
      expect(supabase.from).toHaveBeenCalledWith('trajets');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('t1');
    });

    it('returns empty array on error', async () => {
      const mockChain = createMockChain({
        data: null,
        error: { message: 'DB error' },
      });
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await fetchTrajets('c1');
      expect(result).toEqual([]);
    });

    it('returns empty array when data is null', async () => {
      const mockChain = createMockChain({
        data: null,
        error: null,
      });
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await fetchTrajets('c1');
      expect(result).toEqual([]);
    });
  });

  describe('insertTrajet', () => {
    it('inserts a valid trajet', async () => {
      const mockChain = createMockChain({
        data: { id: 'new_t1' },
        error: null,
      });
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await insertTrajet({
        chauffeur_id: 'c1',
        ville_depart: 'Libreville',
        ville_arrivee: 'Franceville',
        prix: 15000,
        vehicule: 'voiture',
        places_disponibles: 4,
      });

      expect(supabase.from).toHaveBeenCalledWith('trajets');
      expect(result).toEqual({ id: 'new_t1' });
    });

    it('returns null on Supabase error', async () => {
      const mockChain = createMockChain({
        data: null,
        error: { message: 'Insert error' },
      });
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await insertTrajet({
        chauffeur_id: 'c1',
        ville_depart: 'Libreville',
        ville_arrivee: 'Franceville',
        prix: 15000,
        vehicule: 'voiture',
        places_disponibles: 4,
      });

      expect(result).toBeNull();
    });

    it('returns null for invalid city', async () => {
      const result = await insertTrajet({
        chauffeur_id: 'c1',
        ville_depart: '',
        ville_arrivee: 'Franceville',
        prix: 15000,
        vehicule: 'voiture',
        places_disponibles: 4,
      });

      expect(result).toBeNull();
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('returns null for invalid price', async () => {
      const result = await insertTrajet({
        chauffeur_id: 'c1',
        ville_depart: 'Libreville',
        ville_arrivee: 'Franceville',
        prix: -100,
        vehicule: 'voiture',
        places_disponibles: 4,
      });

      expect(result).toBeNull();
    });

    it('returns null for invalid places', async () => {
      const result = await insertTrajet({
        chauffeur_id: 'c1',
        ville_depart: 'Libreville',
        ville_arrivee: 'Franceville',
        prix: 5000,
        vehicule: 'voiture',
        places_disponibles: 0,
      });

      expect(result).toBeNull();
    });
  });

  describe('fetchAllAvailableTrajets', () => {
    it('fetches available trajets with profiles', async () => {
      const mockChain = createMockChain({
        data: [
          { id: 't1', status: 'en_attente', profiles: { name: 'P', avatar: 'a', rating: 4.5 } },
        ],
        error: null,
      });
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await fetchAllAvailableTrajets();
      expect(result).toHaveLength(1);
    });

    it('returns empty array on error', async () => {
      const mockChain = createMockChain({
        data: null,
        error: { message: 'error' },
      });
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await fetchAllAvailableTrajets();
      expect(result).toEqual([]);
    });
  });

  describe('deleteTrajet', () => {
    it('deletes a trajet by id', async () => {
      const mockChain = createMockChain({ data: null, error: null });
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await deleteTrajet('t1');
      expect(result).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('trajets');
    });

    it('returns false on error', async () => {
      const mockChain = createMockChain({
        data: null,
        error: { message: 'Delete error' },
      });
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await deleteTrajet('t1');
      expect(result).toBe(false);
    });
  });

  describe('markTrajetEffectue', () => {
    it('marks a trajet as effectue', async () => {
      const mockChain = createMockChain({ data: null, error: null });
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await markTrajetEffectue('t1');
      expect(result).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('trajets');
    });

    it('returns false on error', async () => {
      const mockChain = createMockChain({
        data: null,
        error: { message: 'Update error' },
      });
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await markTrajetEffectue('t1');
      expect(result).toBe(false);
    });
  });
});
