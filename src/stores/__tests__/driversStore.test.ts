import * as Network from 'expo-network';
import * as Sentry from '@sentry/react-native';
import { useDriversStore } from '../driversStore';
import { supabase } from '../../lib/supabase';
import type { Livreur } from '../../types';

const makeDriver = (overrides: Partial<Livreur> = {}): Livreur => ({
  id: 'driver1',
  prenom: 'Jean',
  vehicule: '🚗 Voiture',
  etoiles: 4.5,
  disponible: true,
  photo: 'https://example.com/photo.jpg',
  commentaires: ['Good driver'],
  distance: 1.5,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  useDriversStore.setState({
    connectedDrivers: [],
    isLoading: false,
  });
});

describe('driversStore', () => {
  describe('addConnectedDriver', () => {
    it('adds a new driver', () => {
      useDriversStore.getState().addConnectedDriver(makeDriver());
      expect(useDriversStore.getState().connectedDrivers).toHaveLength(1);
    });

    it('updates existing driver instead of duplicating', () => {
      useDriversStore.getState().addConnectedDriver(makeDriver({ id: 'd1', prenom: 'A' }));
      useDriversStore.getState().addConnectedDriver(makeDriver({ id: 'd1', prenom: 'B' }));
      const drivers = useDriversStore.getState().connectedDrivers;
      expect(drivers).toHaveLength(1);
      expect(drivers[0].prenom).toBe('B');
    });

    it('adds multiple distinct drivers', () => {
      useDriversStore.getState().addConnectedDriver(makeDriver({ id: 'd1' }));
      useDriversStore.getState().addConnectedDriver(makeDriver({ id: 'd2' }));
      expect(useDriversStore.getState().connectedDrivers).toHaveLength(2);
    });
  });

  describe('removeConnectedDriver', () => {
    it('removes a driver by id', () => {
      useDriversStore.getState().addConnectedDriver(makeDriver({ id: 'd1' }));
      useDriversStore.getState().addConnectedDriver(makeDriver({ id: 'd2' }));
      useDriversStore.getState().removeConnectedDriver('d1');
      const drivers = useDriversStore.getState().connectedDrivers;
      expect(drivers).toHaveLength(1);
      expect(drivers[0].id).toBe('d2');
    });

    it('does nothing for unknown id', () => {
      useDriversStore.getState().addConnectedDriver(makeDriver({ id: 'd1' }));
      useDriversStore.getState().removeConnectedDriver('unknown');
      expect(useDriversStore.getState().connectedDrivers).toHaveLength(1);
    });
  });

  describe('updateDriverAvailability', () => {
    it('updates availability for existing driver', () => {
      useDriversStore.getState().addConnectedDriver(makeDriver({ id: 'd1', disponible: true }));
      useDriversStore.getState().updateDriverAvailability('d1', false);
      expect(useDriversStore.getState().connectedDrivers[0].disponible).toBe(false);
    });

    it('does not affect other drivers', () => {
      useDriversStore.getState().addConnectedDriver(makeDriver({ id: 'd1', disponible: true }));
      useDriversStore.getState().addConnectedDriver(makeDriver({ id: 'd2', disponible: true }));
      useDriversStore.getState().updateDriverAvailability('d1', false);
      expect(useDriversStore.getState().connectedDrivers[1].disponible).toBe(true);
    });
  });

  describe('getAllDrivers', () => {
    it('returns drivers sorted by distance', () => {
      useDriversStore.getState().addConnectedDriver(makeDriver({ id: 'd1', distance: 3.0 }));
      useDriversStore.getState().addConnectedDriver(makeDriver({ id: 'd2', distance: 1.0 }));
      useDriversStore.getState().addConnectedDriver(makeDriver({ id: 'd3', distance: 2.0 }));
      const sorted = useDriversStore.getState().getAllDrivers();
      expect(sorted[0].id).toBe('d2');
      expect(sorted[1].id).toBe('d3');
      expect(sorted[2].id).toBe('d1');
    });
  });

  describe('getAvailableDrivers', () => {
    it('returns only available drivers, sorted by distance', () => {
      useDriversStore.getState().addConnectedDriver(makeDriver({ id: 'd1', disponible: false, distance: 1.0 }));
      useDriversStore.getState().addConnectedDriver(makeDriver({ id: 'd2', disponible: true, distance: 2.0 }));
      useDriversStore.getState().addConnectedDriver(makeDriver({ id: 'd3', disponible: true, distance: 0.5 }));
      const available = useDriversStore.getState().getAvailableDrivers();
      expect(available).toHaveLength(2);
      expect(available[0].id).toBe('d3');
    });
  });

  describe('loadDrivers', () => {
    it('does nothing when offline', async () => {
      (Network.getNetworkStateAsync as jest.Mock).mockResolvedValue({ isConnected: false });
      await useDriversStore.getState().loadDrivers();
      expect(supabase.from).not.toHaveBeenCalled();
      expect(useDriversStore.getState().isLoading).toBe(false);
    });

    it('loads drivers from Supabase', async () => {
      (Network.getNetworkStateAsync as jest.Mock).mockResolvedValue({ isConnected: true });
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [
            { id: 's1', clerk_id: 'c1', name: 'Jean Pierre', rating: 4.5, disponible: true, avatar: null },
          ],
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await useDriversStore.getState().loadDrivers();
      const drivers = useDriversStore.getState().connectedDrivers;
      expect(drivers).toHaveLength(1);
      expect(drivers[0].prenom).toBe('Jean');
      expect(drivers[0].etoiles).toBe(4.5);
    });

    it('reports Supabase errors to Sentry', async () => {
      (Network.getNetworkStateAsync as jest.Mock).mockResolvedValue({ isConnected: true });
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'DB error' },
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await useDriversStore.getState().loadDrivers();
      expect(Sentry.captureException).toHaveBeenCalled();
    });

    it('catches exceptions and reports to Sentry', async () => {
      (Network.getNetworkStateAsync as jest.Mock).mockResolvedValue({ isConnected: true });
      (supabase.from as jest.Mock).mockImplementation(() => {
        throw new Error('crash');
      });

      await useDriversStore.getState().loadDrivers();
      expect(Sentry.captureException).toHaveBeenCalled();
      expect(useDriversStore.getState().isLoading).toBe(false);
    });
  });
});
