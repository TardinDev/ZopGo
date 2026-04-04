import { useVoyagesStore, transportTypes } from '../voyagesStore';
import { fetchAllAvailableTrajets } from '../../lib/supabaseTrajets';

beforeEach(() => {
  jest.clearAllMocks();
  useVoyagesStore.setState({
    trajets: [],
    isLoading: false,
    selectedType: 'All',
    fromCity: '',
    toCity: '',
  });
});

describe('voyagesStore', () => {
  describe('initial state', () => {
    it('starts with empty trajets', () => {
      expect(useVoyagesStore.getState().trajets).toEqual([]);
    });

    it('starts with isLoading false', () => {
      expect(useVoyagesStore.getState().isLoading).toBe(false);
    });

    it('starts with selectedType All', () => {
      expect(useVoyagesStore.getState().selectedType).toBe('All');
    });

    it('starts with empty cities', () => {
      expect(useVoyagesStore.getState().fromCity).toBe('');
      expect(useVoyagesStore.getState().toCity).toBe('');
    });
  });

  describe('transportTypes', () => {
    it('contains expected types', () => {
      expect(transportTypes).toEqual(['All', 'Moto', 'Voiture', 'Camionnette']);
    });
  });

  describe('loadVoyages', () => {
    it('maps Supabase data to Voyage format', async () => {
      (fetchAllAvailableTrajets as jest.Mock).mockResolvedValue([
        {
          id: 'uuid-1',
          chauffeur_id: 'chauff-1',
          vehicule: 'moto',
          ville_depart: 'Libreville',
          ville_arrivee: 'Franceville',
          prix: 15000,
          profiles: { name: 'Pierre', avatar: 'avatar.jpg', rating: 4.5 },
          places_disponibles: 2,
          date: '2026-03-15',
        },
      ]);

      await useVoyagesStore.getState().loadVoyages();
      const state = useVoyagesStore.getState();
      expect(state.trajets).toHaveLength(1);
      expect(state.trajets[0]).toEqual({
        id: 'uuid-1',
        type: 'Moto',
        from: 'Libreville',
        to: 'Franceville',
        price: '15000 FCFA',
        icon: '🏍️',
        chauffeurName: 'Pierre',
        chauffeurAvatar: 'avatar.jpg',
        chauffeurRating: 4.5,
        chauffeurProfileId: 'chauff-1',
        placesDisponibles: 2,
        date: '2026-03-15',
      });
    });

    it('sets isLoading during fetch', async () => {
      let resolvePromise: (value: unknown[]) => void;
      (fetchAllAvailableTrajets as jest.Mock).mockReturnValue(
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
      );

      const promise = useVoyagesStore.getState().loadVoyages();
      expect(useVoyagesStore.getState().isLoading).toBe(true);

      resolvePromise!([]);
      await promise;
      expect(useVoyagesStore.getState().isLoading).toBe(false);
    });

    it('handles unknown vehicle type gracefully', async () => {
      (fetchAllAvailableTrajets as jest.Mock).mockResolvedValue([
        {
          id: 'uuid-bus',
          chauffeur_id: 'cf-bus',
          vehicule: 'bus',
          ville_depart: 'A',
          ville_arrivee: 'B',
          prix: 5000,
          profiles: null,
          places_disponibles: 10,
          date: null,
        },
      ]);

      await useVoyagesStore.getState().loadVoyages();
      const trajet = useVoyagesStore.getState().trajets[0];
      expect(trajet.type).toBe('bus');
      expect(trajet.icon).toBe('🚗');
      expect(trajet.date).toBeUndefined();
    });

    it('handles API error', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      (fetchAllAvailableTrajets as jest.Mock).mockRejectedValue(new Error('Network error'));

      await useVoyagesStore.getState().loadVoyages();
      expect(useVoyagesStore.getState().isLoading).toBe(false);
      expect(useVoyagesStore.getState().trajets).toEqual([]);
    });

    it('maps multiple trajets with correct ids', async () => {
      (fetchAllAvailableTrajets as jest.Mock).mockResolvedValue([
        { id: 'uuid-a', chauffeur_id: 'cf-a', vehicule: 'voiture', ville_depart: 'A', ville_arrivee: 'B', prix: 1000, profiles: null, places_disponibles: 3, date: null },
        { id: 'uuid-b', chauffeur_id: 'cf-b', vehicule: 'camionnette', ville_depart: 'C', ville_arrivee: 'D', prix: 2000, profiles: null, places_disponibles: 5, date: null },
      ]);

      await useVoyagesStore.getState().loadVoyages();
      const trajets = useVoyagesStore.getState().trajets;
      expect(trajets).toHaveLength(2);
      expect(trajets[0].id).toBe('uuid-a');
      expect(trajets[1].id).toBe('uuid-b');
      expect(trajets[1].type).toBe('Camionnette');
      expect(trajets[1].icon).toBe('🚐');
    });
  });

  describe('setSelectedType', () => {
    it('updates selected type', () => {
      useVoyagesStore.getState().setSelectedType('Moto');
      expect(useVoyagesStore.getState().selectedType).toBe('Moto');
    });
  });

  describe('setFromCity', () => {
    it('updates from city', () => {
      useVoyagesStore.getState().setFromCity('Libreville');
      expect(useVoyagesStore.getState().fromCity).toBe('Libreville');
    });
  });

  describe('setToCity', () => {
    it('updates to city', () => {
      useVoyagesStore.getState().setToCity('Franceville');
      expect(useVoyagesStore.getState().toCity).toBe('Franceville');
    });
  });

  describe('swapCities', () => {
    it('swaps from and to cities', () => {
      useVoyagesStore.getState().setFromCity('Libreville');
      useVoyagesStore.getState().setToCity('Franceville');
      useVoyagesStore.getState().swapCities();
      expect(useVoyagesStore.getState().fromCity).toBe('Franceville');
      expect(useVoyagesStore.getState().toCity).toBe('Libreville');
    });

    it('works with empty cities', () => {
      useVoyagesStore.getState().setFromCity('Libreville');
      useVoyagesStore.getState().swapCities();
      expect(useVoyagesStore.getState().fromCity).toBe('');
      expect(useVoyagesStore.getState().toCity).toBe('Libreville');
    });
  });

  describe('resetFilters', () => {
    it('resets all filters to defaults', () => {
      useVoyagesStore.getState().setSelectedType('Moto');
      useVoyagesStore.getState().setFromCity('Libreville');
      useVoyagesStore.getState().setToCity('Franceville');
      useVoyagesStore.getState().resetFilters();
      const state = useVoyagesStore.getState();
      expect(state.selectedType).toBe('All');
      expect(state.fromCity).toBe('');
      expect(state.toCity).toBe('');
    });

    it('does not clear trajets', () => {
      useVoyagesStore.setState({ trajets: [{ id: 'uuid-x', type: 'Moto', from: 'A', to: 'B', price: '1000', icon: '🏍️' }] });
      useVoyagesStore.getState().resetFilters();
      expect(useVoyagesStore.getState().trajets).toHaveLength(1);
    });
  });
});
