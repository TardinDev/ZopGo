import { useVoyagesStore, transportTypes } from '../voyagesStore';
import { fetchAllAvailableTrajets } from '../../lib/supabaseTrajets';

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  useVoyagesStore.setState({
    trajets: [],
    isLoading: false,
    error: null,
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
      expect(transportTypes).toEqual(['All', 'Taxi', 'Voiture', 'Bus', 'Train', 'Avion', 'Bateaux']);
    });

    it('excludes Moto (livraisons-only mode)', () => {
      expect(transportTypes).not.toContain('Moto');
    });

    it('excludes Camionnette', () => {
      expect(transportTypes).not.toContain('Camionnette');
    });

    it('includes Bus', () => {
      expect(transportTypes).toContain('Bus');
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
        marque: undefined,
        modele: undefined,
        couleur: undefined,
        // Agency fields default to falsy when the publishing profile is a
        // regular chauffeur (no role='agence' in the joined profiles row).
        isAgence: false,
        agencyName: undefined,
        agencyLogoUrl: undefined,
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

    it('maps bus vehicule to "Bus" label and 🚌 icon', async () => {
      (fetchAllAvailableTrajets as jest.Mock).mockResolvedValue([
        {
          id: 'uuid-bus',
          chauffeur_id: 'cf-bus',
          vehicule: 'bus',
          ville_depart: 'Libreville',
          ville_arrivee: 'Port-Gentil',
          prix: 5000,
          profiles: null,
          places_disponibles: 30,
          date: null,
        },
      ]);

      await useVoyagesStore.getState().loadVoyages();
      const trajet = useVoyagesStore.getState().trajets[0];
      expect(trajet.type).toBe('Bus');
      expect(trajet.icon).toBe('🚌');
      expect(trajet.date).toBeUndefined();
    });

    it('handles unknown vehicle type gracefully', async () => {
      (fetchAllAvailableTrajets as jest.Mock).mockResolvedValue([
        {
          id: 'uuid-unknown',
          chauffeur_id: 'cf-x',
          vehicule: 'helicoptere',
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
      // Unknown vehicule values fall back to the raw string + a generic icon
      // so the listing is never silently dropped from the client UI.
      expect(trajet.type).toBe('helicoptere');
      expect(trajet.icon).toBe('🚗');
    });

    it('still maps legacy moto trajets (backward compat for old DB rows)', async () => {
      (fetchAllAvailableTrajets as jest.Mock).mockResolvedValue([
        {
          id: 'uuid-legacy',
          chauffeur_id: 'cf-legacy',
          vehicule: 'moto',
          ville_depart: 'A',
          ville_arrivee: 'B',
          prix: 3000,
          profiles: null,
          places_disponibles: 1,
          date: null,
        },
      ]);

      await useVoyagesStore.getState().loadVoyages();
      const trajet = useVoyagesStore.getState().trajets[0];
      expect(trajet.type).toBe('Moto');
      expect(trajet.icon).toBe('🏍️');
    });

    it('surfaces agency identity (logo + name) when the publishing profile has role=agence', async () => {
      (fetchAllAvailableTrajets as jest.Mock).mockResolvedValue([
        {
          id: 'uuid-agency',
          chauffeur_id: 'cf-agency-1',
          vehicule: 'avion',
          ville_depart: 'Libreville',
          ville_arrivee: 'Paris',
          prix: 450000,
          profiles: {
            name: 'Air ZopGo SA',
            avatar: 'placeholder.png',
            rating: 4.8,
            role: 'agence',
            agency_name: 'Air ZopGo',
            agency_logo_url: 'https://cdn.example/airzopgo.png',
          },
          places_disponibles: 120,
          date: null,
        },
      ]);

      await useVoyagesStore.getState().loadVoyages();
      const trajet = useVoyagesStore.getState().trajets[0];
      expect(trajet.isAgence).toBe(true);
      expect(trajet.agencyName).toBe('Air ZopGo');
      expect(trajet.agencyLogoUrl).toBe('https://cdn.example/airzopgo.png');
      expect(trajet.type).toBe('Avion');
      expect(trajet.icon).toBe('✈️');
    });

    it('sets error message and clears loading on API failure', async () => {
      (fetchAllAvailableTrajets as jest.Mock).mockRejectedValue(new Error('Network error'));

      await useVoyagesStore.getState().loadVoyages();
      const state = useVoyagesStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.trajets).toEqual([]);
      expect(state.error).toBe('Impossible de charger les trajets. Vérifie ta connexion.');
    });

    it('clears a previous error on a successful retry', async () => {
      // 1st call fails
      (fetchAllAvailableTrajets as jest.Mock).mockRejectedValueOnce(new Error('boom'));
      await useVoyagesStore.getState().loadVoyages();
      expect(useVoyagesStore.getState().error).not.toBeNull();

      // 2nd call succeeds — error must be reset to null so the UI leaves the
      // retry banner state.
      (fetchAllAvailableTrajets as jest.Mock).mockResolvedValueOnce([]);
      await useVoyagesStore.getState().loadVoyages();
      expect(useVoyagesStore.getState().error).toBeNull();
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
      useVoyagesStore.getState().setSelectedType('Bus');
      expect(useVoyagesStore.getState().selectedType).toBe('Bus');
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
      useVoyagesStore.getState().setSelectedType('Bus');
      useVoyagesStore.getState().setFromCity('Libreville');
      useVoyagesStore.getState().setToCity('Franceville');
      useVoyagesStore.getState().resetFilters();
      const state = useVoyagesStore.getState();
      expect(state.selectedType).toBe('All');
      expect(state.fromCity).toBe('');
      expect(state.toCity).toBe('');
    });

    it('does not clear trajets', () => {
      useVoyagesStore.setState({ trajets: [{ id: 'uuid-x', type: 'Bus', from: 'A', to: 'B', price: '1000', icon: '🚌' }] });
      useVoyagesStore.getState().resetFilters();
      expect(useVoyagesStore.getState().trajets).toHaveLength(1);
    });
  });
});
