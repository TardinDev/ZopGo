// Unmock this module so we test the real implementation
jest.unmock('../supabaseHebergements');

import { supabase } from '../supabase';
import {
  fetchHebergements,
  insertHebergement,
  fetchAllAvailableHebergements,
  deleteHebergement,
  toggleHebergementStatus,
} from '../supabaseHebergements';

function createMockChain(resolvedValue: { data: unknown; error: unknown }) {
  const chain: Record<string, jest.Mock> & { then?: jest.Mock } = {};
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'or', 'order', 'limit', 'single'];
  methods.forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain.then = jest.fn((resolve, reject) => {
    return Promise.resolve(resolvedValue).then(resolve, reject);
  });
  return chain;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('supabaseHebergements', () => {
  describe('fetchHebergements', () => {
    it('fetches hebergements for a hebergeur', async () => {
      const mockChain = createMockChain({
        data: [{ id: 'h1', hebergeur_id: 'heb1', nom: 'Hotel' }],
        error: null,
      });
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await fetchHebergements('heb1');
      expect(supabase.from).toHaveBeenCalledWith('hebergements');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('h1');
    });

    it('returns empty array on error', async () => {
      const mockChain = createMockChain({
        data: null,
        error: { message: 'DB error' },
      });
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await fetchHebergements('heb1');
      expect(result).toEqual([]);
    });

    it('returns empty array when data is null', async () => {
      const mockChain = createMockChain({
        data: null,
        error: null,
      });
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await fetchHebergements('heb1');
      expect(result).toEqual([]);
    });
  });

  describe('insertHebergement', () => {
    it('inserts a valid hebergement', async () => {
      const mockChain = createMockChain({
        data: { id: 'new_h1' },
        error: null,
      });
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await insertHebergement({
        hebergeur_id: 'heb1',
        nom: 'Hotel Gabon',
        type: 'hotel',
        ville: 'Libreville',
        adresse: '123 rue',
        prix_par_nuit: 25000,
        capacite: 4,
        description: 'Super hotel',
      });

      expect(supabase.from).toHaveBeenCalledWith('hebergements');
      expect(result).toEqual({ id: 'new_h1' });
    });

    it('returns null on Supabase error', async () => {
      const mockChain = createMockChain({
        data: null,
        error: { message: 'Insert error' },
      });
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await insertHebergement({
        hebergeur_id: 'heb1',
        nom: 'Hotel',
        type: 'hotel',
        ville: 'Libreville',
        adresse: 'rue',
        prix_par_nuit: 10000,
        capacite: 2,
        description: 'desc',
      });

      expect(result).toBeNull();
    });
  });

  describe('fetchAllAvailableHebergements', () => {
    it('fetches available hebergements with profiles', async () => {
      const mockChain = createMockChain({
        data: [
          { id: 'h1', status: 'actif', profiles: { name: 'M', avatar: 'a', rating: 4.5 } },
        ],
        error: null,
      });
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await fetchAllAvailableHebergements();
      expect(result).toHaveLength(1);
    });

    it('returns empty array on error', async () => {
      const mockChain = createMockChain({
        data: null,
        error: { message: 'error' },
      });
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await fetchAllAvailableHebergements();
      expect(result).toEqual([]);
    });
  });

  describe('deleteHebergement', () => {
    it('deletes a hebergement by id', async () => {
      const mockChain = createMockChain({ data: null, error: null });
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await deleteHebergement('h1');
      expect(result).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('hebergements');
    });

    it('returns false on error', async () => {
      const mockChain = createMockChain({
        data: null,
        error: { message: 'Delete error' },
      });
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await deleteHebergement('h1');
      expect(result).toBe(false);
    });
  });

  describe('toggleHebergementStatus', () => {
    it('toggles hebergement status', async () => {
      const mockChain = createMockChain({ data: null, error: null });
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await toggleHebergementStatus('h1', 'inactif');
      expect(result).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('hebergements');
    });

    it('returns false on error', async () => {
      const mockChain = createMockChain({
        data: null,
        error: { message: 'Update error' },
      });
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await toggleHebergementStatus('h1', 'actif');
      expect(result).toBe(false);
    });
  });
});
