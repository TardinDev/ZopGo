import { useHebergementsDiscoveryStore, hebergementTypes } from '../hebergementsDiscoveryStore';
import { fetchAllAvailableHebergements } from '../../lib/supabaseHebergements';

beforeEach(() => {
  jest.clearAllMocks();
  useHebergementsDiscoveryStore.setState({
    listings: [],
    isLoading: false,
    selectedType: 'All',
    searchLocation: '',
  });
});

describe('hebergementsDiscoveryStore', () => {
  describe('initial state', () => {
    it('starts with empty listings', () => {
      expect(useHebergementsDiscoveryStore.getState().listings).toEqual([]);
    });

    it('starts with isLoading false', () => {
      expect(useHebergementsDiscoveryStore.getState().isLoading).toBe(false);
    });

    it('starts with selectedType All', () => {
      expect(useHebergementsDiscoveryStore.getState().selectedType).toBe('All');
    });

    it('starts with empty search location', () => {
      expect(useHebergementsDiscoveryStore.getState().searchLocation).toBe('');
    });
  });

  describe('hebergementTypes', () => {
    it('contains expected types', () => {
      expect(hebergementTypes).toEqual(['All', 'Hôtel', 'Auberge', 'Appart.', 'Maison', 'Chambre']);
    });
  });

  describe('loadHebergements', () => {
    it('maps Supabase data to Hebergement format', async () => {
      (fetchAllAvailableHebergements as jest.Mock).mockResolvedValue([
        {
          id: 'uuid-1',
          hebergeur_id: 'heb-1',
          type: 'hotel',
          nom: 'Hotel Gabon',
          ville: 'Libreville',
          prix_par_nuit: 25000,
          profiles: { name: 'Marie', avatar: 'avatar.jpg', rating: 4.5 },
          capacite: 4,
          disponibilite: 3,
          description: 'Super hotel',
          adresse: '123 rue',
        },
      ]);

      await useHebergementsDiscoveryStore.getState().loadHebergements();
      const state = useHebergementsDiscoveryStore.getState();
      expect(state.listings).toHaveLength(1);
      expect(state.listings[0]).toEqual({
        id: 1,
        supabaseId: 'uuid-1',
        type: 'Hôtel',
        name: 'Hotel Gabon',
        location: 'Libreville',
        price: '25000 FCFA/nuit',
        prixParNuit: 25000,
        rating: 4.5,
        icon: '🏨',
        images: [],
        hebergeurName: 'Marie',
        hebergeurAvatar: 'avatar.jpg',
        hebergeurRating: 4.5,
        hebergeurProfileId: 'heb-1',
        capacite: 4,
        disponibilite: 3,
        description: 'Super hotel',
        adresse: '123 rue',
      });
    });

    it('sets isLoading during fetch', async () => {
      let resolvePromise: (value: unknown[]) => void;
      (fetchAllAvailableHebergements as jest.Mock).mockReturnValue(
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
      );

      const promise = useHebergementsDiscoveryStore.getState().loadHebergements();
      expect(useHebergementsDiscoveryStore.getState().isLoading).toBe(true);

      resolvePromise!([]);
      await promise;
      expect(useHebergementsDiscoveryStore.getState().isLoading).toBe(false);
    });

    it('handles unknown type gracefully', async () => {
      (fetchAllAvailableHebergements as jest.Mock).mockResolvedValue([
        {
          type: 'villa',
          nom: 'Villa',
          ville: 'Libreville',
          prix_par_nuit: 50000,
          profiles: null,
          capacite: 2,
          description: '',
          adresse: '',
        },
      ]);

      await useHebergementsDiscoveryStore.getState().loadHebergements();
      const listing = useHebergementsDiscoveryStore.getState().listings[0];
      expect(listing.type).toBe('villa');
      expect(listing.icon).toBe('🏨');
      expect(listing.rating).toBe(0);
    });

    it('handles API error', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      (fetchAllAvailableHebergements as jest.Mock).mockRejectedValue(new Error('error'));

      await useHebergementsDiscoveryStore.getState().loadHebergements();
      expect(useHebergementsDiscoveryStore.getState().isLoading).toBe(false);
      expect(useHebergementsDiscoveryStore.getState().listings).toEqual([]);
    });

    it('maps all known types correctly', async () => {
      (fetchAllAvailableHebergements as jest.Mock).mockResolvedValue([
        { type: 'hotel', nom: 'H', ville: 'V', prix_par_nuit: 1, profiles: null, capacite: 1, description: '', adresse: '' },
        { type: 'auberge', nom: 'A', ville: 'V', prix_par_nuit: 1, profiles: null, capacite: 1, description: '', adresse: '' },
        { type: 'appartement', nom: 'Ap', ville: 'V', prix_par_nuit: 1, profiles: null, capacite: 1, description: '', adresse: '' },
        { type: 'maison', nom: 'M', ville: 'V', prix_par_nuit: 1, profiles: null, capacite: 1, description: '', adresse: '' },
        { type: 'chambre', nom: 'C', ville: 'V', prix_par_nuit: 1, profiles: null, capacite: 1, description: '', adresse: '' },
      ]);

      await useHebergementsDiscoveryStore.getState().loadHebergements();
      const listings = useHebergementsDiscoveryStore.getState().listings;
      expect(listings.map((l) => l.type)).toEqual(['Hôtel', 'Auberge', 'Appart.', 'Maison', 'Chambre']);
      expect(listings.map((l) => l.icon)).toEqual(['🏨', '🏠', '🏢', '🏡', '🛏️']);
    });
  });

  describe('setSelectedType', () => {
    it('updates selected type', () => {
      useHebergementsDiscoveryStore.getState().setSelectedType('Hôtel');
      expect(useHebergementsDiscoveryStore.getState().selectedType).toBe('Hôtel');
    });
  });

  describe('setSearchLocation', () => {
    it('updates search location', () => {
      useHebergementsDiscoveryStore.getState().setSearchLocation('Libreville');
      expect(useHebergementsDiscoveryStore.getState().searchLocation).toBe('Libreville');
    });
  });
});
