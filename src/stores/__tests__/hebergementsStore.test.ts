import { useHebergementsStore } from '../hebergementsStore';
import {
  fetchHebergements,
  insertHebergement,
  deleteHebergement,
  toggleHebergementStatus,
} from '../../lib/supabaseHebergements';

beforeEach(() => {
  jest.clearAllMocks();
  useHebergementsStore.setState({
    listings: [],
    formData: {
      nom: '',
      type: 'hotel',
      ville: '',
      adresse: '',
      prixParNuit: '',
      capacite: '1',
      description: '',
    },
    isLoading: false,
  });
});

describe('hebergementsStore', () => {
  describe('initial state', () => {
    it('starts with empty listings', () => {
      expect(useHebergementsStore.getState().listings).toEqual([]);
    });

    it('starts with default form data', () => {
      const form = useHebergementsStore.getState().formData;
      expect(form.nom).toBe('');
      expect(form.type).toBe('hotel');
      expect(form.capacite).toBe('1');
    });
  });

  describe('updateForm', () => {
    it('updates a single field', () => {
      useHebergementsStore.getState().updateForm('nom', 'Hotel Libreville');
      expect(useHebergementsStore.getState().formData.nom).toBe('Hotel Libreville');
    });

    it('preserves other fields', () => {
      useHebergementsStore.getState().updateForm('nom', 'Hotel');
      useHebergementsStore.getState().updateForm('ville', 'Libreville');
      const form = useHebergementsStore.getState().formData;
      expect(form.nom).toBe('Hotel');
      expect(form.ville).toBe('Libreville');
    });
  });

  describe('resetForm', () => {
    it('resets form to initial values', () => {
      useHebergementsStore.getState().updateForm('nom', 'Hotel');
      useHebergementsStore.getState().updateForm('ville', 'Libreville');
      useHebergementsStore.getState().resetForm();
      const form = useHebergementsStore.getState().formData;
      expect(form.nom).toBe('');
      expect(form.ville).toBe('');
      expect(form.type).toBe('hotel');
    });
  });

  describe('addListing', () => {
    it('adds listing locally with optimistic update', async () => {
      useHebergementsStore.setState({
        formData: {
          nom: 'Hotel Test',
          type: 'hotel',
          ville: 'Libreville',
          adresse: '123 rue',
          prixParNuit: '25000',
          capacite: '3',
          description: 'Beau hotel',
        },
      });

      await useHebergementsStore.getState().addListing('heb_1');
      const listings = useHebergementsStore.getState().listings;
      expect(listings).toHaveLength(1);
      expect(listings[0].nom).toBe('Hotel Test');
      expect(listings[0].prixParNuit).toBe(25000);
      expect(listings[0].capacite).toBe(3);
      expect(listings[0].status).toBe('actif');
    });

    it('resets form after adding', async () => {
      useHebergementsStore.setState({
        formData: {
          nom: 'Hotel',
          type: 'hotel',
          ville: 'Libreville',
          adresse: 'rue',
          prixParNuit: '10000',
          capacite: '2',
          description: 'desc',
        },
      });

      await useHebergementsStore.getState().addListing('heb_1');
      expect(useHebergementsStore.getState().formData.nom).toBe('');
    });

    it('syncs with Supabase when supabaseProfileId provided', async () => {
      (insertHebergement as jest.Mock).mockResolvedValue({ id: 'supa_heb_1' });
      useHebergementsStore.setState({
        formData: {
          nom: 'Hotel',
          type: 'hotel',
          ville: 'Libreville',
          adresse: 'rue',
          prixParNuit: '10000',
          capacite: '2',
          description: 'desc',
        },
      });

      await useHebergementsStore.getState().addListing('heb_1', 'supa_profile_1');
      expect(insertHebergement).toHaveBeenCalledWith(
        expect.objectContaining({
          hebergeur_id: 'supa_profile_1',
          nom: 'Hotel',
          type: 'hotel',
          ville: 'Libreville',
        })
      );
      const listings = useHebergementsStore.getState().listings;
      expect(listings[0].id).toBe('supa_heb_1');
    });

    it('removes local listing on Supabase error', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      (insertHebergement as jest.Mock).mockRejectedValue(new Error('DB error'));
      useHebergementsStore.setState({
        formData: {
          nom: 'Hotel',
          type: 'hotel',
          ville: 'Libreville',
          adresse: 'rue',
          prixParNuit: '10000',
          capacite: '2',
          description: 'desc',
        },
      });

      await useHebergementsStore.getState().addListing('heb_1', 'supa_profile_1');
      expect(useHebergementsStore.getState().listings).toHaveLength(0);
    });

    it('does not call Supabase without supabaseProfileId', async () => {
      useHebergementsStore.setState({
        formData: {
          nom: 'Hotel',
          type: 'hotel',
          ville: 'V',
          adresse: 'A',
          prixParNuit: '5000',
          capacite: '1',
          description: 'D',
        },
      });

      await useHebergementsStore.getState().addListing('heb_1');
      expect(insertHebergement).not.toHaveBeenCalled();
    });

    it('handles invalid price as 0', async () => {
      useHebergementsStore.setState({
        formData: {
          nom: 'H',
          type: 'hotel',
          ville: 'V',
          adresse: 'A',
          prixParNuit: 'abc',
          capacite: 'xyz',
          description: 'D',
        },
      });

      await useHebergementsStore.getState().addListing('heb_1');
      const listing = useHebergementsStore.getState().listings[0];
      expect(listing.prixParNuit).toBe(0);
      expect(listing.capacite).toBe(1);
    });
  });

  describe('removeListing', () => {
    it('removes listing optimistically', async () => {
      useHebergementsStore.setState({
        listings: [
          { id: '1', hebergeurId: 'h1', nom: 'A', type: 'hotel', ville: 'V', adresse: 'A', prixParNuit: 1000, capacite: 1, description: '', status: 'actif', createdAt: '' },
          { id: '2', hebergeurId: 'h1', nom: 'B', type: 'hotel', ville: 'V', adresse: 'A', prixParNuit: 2000, capacite: 2, description: '', status: 'actif', createdAt: '' },
        ],
      });

      await useHebergementsStore.getState().removeListing('1');
      expect(useHebergementsStore.getState().listings).toHaveLength(1);
      expect(useHebergementsStore.getState().listings[0].id).toBe('2');
    });

    it('restores listing on Supabase error', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      (deleteHebergement as jest.Mock).mockRejectedValue(new Error('DB error'));
      useHebergementsStore.setState({
        listings: [
          { id: '1', hebergeurId: 'h1', nom: 'A', type: 'hotel', ville: 'V', adresse: 'A', prixParNuit: 1000, capacite: 1, description: '', status: 'actif', createdAt: '' },
        ],
      });

      await useHebergementsStore.getState().removeListing('1');
      expect(useHebergementsStore.getState().listings).toHaveLength(1);
    });
  });

  describe('toggleStatus', () => {
    it('toggles actif to inactif', async () => {
      useHebergementsStore.setState({
        listings: [
          { id: '1', hebergeurId: 'h1', nom: 'A', type: 'hotel', ville: 'V', adresse: 'A', prixParNuit: 1000, capacite: 1, description: '', status: 'actif', createdAt: '' },
        ],
      });

      await useHebergementsStore.getState().toggleStatus('1');
      expect(useHebergementsStore.getState().listings[0].status).toBe('inactif');
      expect(toggleHebergementStatus).toHaveBeenCalledWith('1', 'inactif');
    });

    it('toggles inactif to actif', async () => {
      useHebergementsStore.setState({
        listings: [
          { id: '1', hebergeurId: 'h1', nom: 'A', type: 'hotel', ville: 'V', adresse: 'A', prixParNuit: 1000, capacite: 1, description: '', status: 'inactif', createdAt: '' },
        ],
      });

      await useHebergementsStore.getState().toggleStatus('1');
      expect(useHebergementsStore.getState().listings[0].status).toBe('actif');
    });

    it('does nothing for non-existent id', async () => {
      useHebergementsStore.setState({ listings: [] });
      await useHebergementsStore.getState().toggleStatus('nonexistent');
      expect(toggleHebergementStatus).not.toHaveBeenCalled();
    });

    it('reverts on Supabase error', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      (toggleHebergementStatus as jest.Mock).mockRejectedValue(new Error('error'));
      useHebergementsStore.setState({
        listings: [
          { id: '1', hebergeurId: 'h1', nom: 'A', type: 'hotel', ville: 'V', adresse: 'A', prixParNuit: 1000, capacite: 1, description: '', status: 'actif', createdAt: '' },
        ],
      });

      await useHebergementsStore.getState().toggleStatus('1');
      expect(useHebergementsStore.getState().listings[0].status).toBe('actif');
    });
  });

  describe('loadListings', () => {
    it('loads and transforms data from Supabase', async () => {
      (fetchHebergements as jest.Mock).mockResolvedValue([
        {
          id: 'h1',
          hebergeur_id: 'heb1',
          nom: 'Hotel Gabon',
          type: 'hotel',
          ville: 'Libreville',
          adresse: '123 rue',
          prix_par_nuit: 25000,
          capacite: 4,
          description: 'Super hotel',
          status: 'actif',
          created_at: '2026-01-01',
        },
      ]);

      await useHebergementsStore.getState().loadListings('supa_1');
      const listings = useHebergementsStore.getState().listings;
      expect(listings).toHaveLength(1);
      expect(listings[0].nom).toBe('Hotel Gabon');
      expect(listings[0].prixParNuit).toBe(25000);
    });

    it('sets isLoading during fetch', async () => {
      let resolvePromise: (value: unknown[]) => void;
      (fetchHebergements as jest.Mock).mockReturnValue(
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
      );

      const promise = useHebergementsStore.getState().loadListings('supa_1');
      expect(useHebergementsStore.getState().isLoading).toBe(true);

      resolvePromise!([]);
      await promise;
      expect(useHebergementsStore.getState().isLoading).toBe(false);
    });

    it('handles error gracefully', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      (fetchHebergements as jest.Mock).mockRejectedValue(new Error('Network error'));

      await useHebergementsStore.getState().loadListings('supa_1');
      expect(useHebergementsStore.getState().isLoading).toBe(false);
    });
  });
});
