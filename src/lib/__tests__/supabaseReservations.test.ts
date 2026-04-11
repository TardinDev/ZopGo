// Unmock this module so we test the real implementation
jest.unmock('../supabaseReservations');

import { supabase } from '../supabase';
import {
  insertReservation,
  fetchReservationsForChauffeur,
  fetchReservationsForClient,
  fetchReservationById,
  acceptReservation,
  refuseReservation,
} from '../supabaseReservations';

function createMockChain(resolvedValue: { data: unknown; error: unknown }) {
  const result = resolvedValue;
  const chain: Record<string, jest.Mock> & { then?: jest.Mock } = {};
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'or', 'order', 'limit', 'single'];
  methods.forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain.then = jest.fn((resolve, reject) => {
    return Promise.resolve(result).then(resolve, reject);
  });
  return chain;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('supabaseReservations', () => {
  describe('insertReservation', () => {
    it('inserts a reservation successfully', async () => {
      const mockChain = createMockChain({
        data: {
          id: 'res-1',
          trajet_id: 't1',
          client_id: 'c1',
          chauffeur_id: 'cf1',
          nombre_places: 2,
          prix_total: 10000,
          status: 'en_attente',
          created_at: '2026-01-01',
          updated_at: '2026-01-01',
        },
        error: null,
      });
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await insertReservation({
        trajet_id: 't1',
        client_id: 'c1',
        chauffeur_id: 'cf1',
        nombre_places: 2,
        prix_total: 10000,
      });

      expect(supabase.from).toHaveBeenCalledWith('reservations');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('res-1');
      expect(result?.nombrePlaces).toBe(2);
    });

    it('returns null on error', async () => {
      const mockChain = createMockChain({
        data: null,
        error: { message: 'Insert error' },
      });
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await insertReservation({
        trajet_id: 't1',
        client_id: 'c1',
        chauffeur_id: 'cf1',
        nombre_places: 1,
        prix_total: 5000,
      });

      expect(result).toBeNull();
    });
  });

  describe('fetchReservationsForChauffeur', () => {
    it('fetches reservations for a chauffeur', async () => {
      const mockChain = createMockChain({
        data: [
          {
            id: 'res-1',
            trajet_id: 't1',
            client_id: 'c1',
            chauffeur_id: 'cf1',
            nombre_places: 1,
            prix_total: 5000,
            status: 'en_attente',
            created_at: '2026-01-01',
            updated_at: '2026-01-01',
            client: { name: 'Alice', avatar: '' },
            trajet: { ville_depart: 'A', ville_arrivee: 'B', date: null },
          },
        ],
        error: null,
      });
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await fetchReservationsForChauffeur('cf1');
      expect(result).toHaveLength(1);
      expect(result[0].clientName).toBe('Alice');
    });

    it('returns empty array on error', async () => {
      const mockChain = createMockChain({
        data: null,
        error: { message: 'err' },
      });
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await fetchReservationsForChauffeur('cf1');
      expect(result).toEqual([]);
    });
  });

  describe('fetchReservationsForClient', () => {
    it('fetches reservations for a client', async () => {
      const mockChain = createMockChain({
        data: [
          {
            id: 'res-2',
            trajet_id: 't1',
            client_id: 'c1',
            chauffeur_id: 'cf1',
            nombre_places: 1,
            prix_total: 5000,
            status: 'acceptee',
            created_at: '2026-01-01',
            updated_at: '2026-01-01',
            chauffeur: { name: 'Bob', avatar: '' },
            trajet: { ville_depart: 'A', ville_arrivee: 'B', date: null },
          },
        ],
        error: null,
      });
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await fetchReservationsForClient('c1');
      expect(result).toHaveLength(1);
      expect(result[0].chauffeurName).toBe('Bob');
    });
  });

  describe('fetchReservationById', () => {
    it('returns trajetId and nombrePlaces on success', async () => {
      const mockChain = createMockChain({
        data: { trajet_id: 't1', nombre_places: 3 },
        error: null,
      });
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await fetchReservationById('res-1');
      expect(result).toEqual({ trajetId: 't1', nombrePlaces: 3 });
    });

    it('returns null on error', async () => {
      const mockChain = createMockChain({
        data: null,
        error: { message: 'not found' },
      });
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await fetchReservationById('res-missing');
      expect(result).toBeNull();
    });
  });

  describe('acceptReservation', () => {
    it('updates status to acceptee', async () => {
      const mockChain = createMockChain({ data: null, error: null });
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await acceptReservation('res-1');
      expect(result).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('reservations');
    });

    it('returns false on error', async () => {
      const mockChain = createMockChain({
        data: null,
        error: { message: 'err' },
      });
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await acceptReservation('res-1');
      expect(result).toBe(false);
    });
  });

  describe('refuseReservation', () => {
    it('updates status to refusee', async () => {
      const mockChain = createMockChain({ data: null, error: null });
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await refuseReservation('res-1');
      expect(result).toBe(true);
    });

    it('returns false on error', async () => {
      const mockChain = createMockChain({
        data: null,
        error: { message: 'err' },
      });
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await refuseReservation('res-1');
      expect(result).toBe(false);
    });
  });
});
