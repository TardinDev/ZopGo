import { useTrajetsStore } from '../trajetsStore';
import {
  fetchTrajets,
  insertTrajet,
  deleteTrajet,
  markTrajetEffectue,
} from '../../lib/supabaseTrajets';

beforeEach(() => {
  jest.clearAllMocks();
  useTrajetsStore.setState({
    trajets: [],
    formData: {
      villeDepart: '',
      villeArrivee: '',
      prix: '',
      vehicule: 'voiture',
      date: '',
      placesDisponibles: '1',
      marque: '',
      modele: '',
      couleur: '',
    },
    isLoading: false,
  });
});

describe('trajetsStore', () => {
  describe('initial state', () => {
    it('starts with empty trajets', () => {
      expect(useTrajetsStore.getState().trajets).toEqual([]);
    });

    it('starts with default form data', () => {
      const form = useTrajetsStore.getState().formData;
      expect(form.vehicule).toBe('voiture');
      expect(form.placesDisponibles).toBe('1');
    });
  });

  describe('updateForm', () => {
    it('updates a single field', () => {
      useTrajetsStore.getState().updateForm('villeDepart', 'Libreville');
      expect(useTrajetsStore.getState().formData.villeDepart).toBe('Libreville');
    });

    it('preserves other fields', () => {
      useTrajetsStore.getState().updateForm('villeDepart', 'Libreville');
      useTrajetsStore.getState().updateForm('villeArrivee', 'Franceville');
      const form = useTrajetsStore.getState().formData;
      expect(form.villeDepart).toBe('Libreville');
      expect(form.villeArrivee).toBe('Franceville');
    });
  });

  describe('resetForm', () => {
    it('resets form to initial values', () => {
      useTrajetsStore.getState().updateForm('villeDepart', 'Libreville');
      useTrajetsStore.getState().updateForm('prix', '5000');
      useTrajetsStore.getState().resetForm();
      const form = useTrajetsStore.getState().formData;
      expect(form.villeDepart).toBe('');
      expect(form.prix).toBe('');
      expect(form.vehicule).toBe('voiture');
    });
  });

  describe('addTrajet', () => {
    it('adds trajet locally with optimistic update', async () => {
      useTrajetsStore.setState({
        formData: {
          villeDepart: 'Libreville',
          villeArrivee: 'Franceville',
          prix: '15000',
          vehicule: 'voiture',
          date: '2026-04-01',
          placesDisponibles: '4',
          marque: 'Toyota',
          modele: 'Corolla',
          couleur: 'Blanc',
        },
      });

      await useTrajetsStore.getState().addTrajet('chauffeur_1');
      const trajets = useTrajetsStore.getState().trajets;
      expect(trajets).toHaveLength(1);
      expect(trajets[0].villeDepart).toBe('Libreville');
      expect(trajets[0].villeArrivee).toBe('Franceville');
      expect(trajets[0].prix).toBe(15000);
      expect(trajets[0].placesDisponibles).toBe(4);
      expect(trajets[0].status).toBe('en_attente');
      expect(trajets[0].marque).toBe('Toyota');
      expect(trajets[0].modele).toBe('Corolla');
      expect(trajets[0].couleur).toBe('Blanc');
    });

    it('resets form after adding', async () => {
      useTrajetsStore.setState({
        formData: {
          villeDepart: 'A',
          villeArrivee: 'B',
          prix: '1000',
          vehicule: 'moto',
          date: '',
          placesDisponibles: '1',
          marque: 'Honda',
          modele: '',
          couleur: '',
        },
      });

      await useTrajetsStore.getState().addTrajet('chauffeur_1');
      expect(useTrajetsStore.getState().formData.villeDepart).toBe('');
      expect(useTrajetsStore.getState().formData.marque).toBe('');
    });

    it('syncs with Supabase when supabaseProfileId provided', async () => {
      (insertTrajet as jest.Mock).mockResolvedValue({ id: 'supa_t1' });
      useTrajetsStore.setState({
        formData: {
          villeDepart: 'Libreville',
          villeArrivee: 'Franceville',
          prix: '10000',
          vehicule: 'voiture',
          date: '2026-04-01',
          placesDisponibles: '3',
          marque: 'Toyota',
          modele: 'Hilux',
          couleur: 'Noir',
        },
      });

      await useTrajetsStore.getState().addTrajet('chauffeur_1', 'supa_chauffeur_1');
      expect(insertTrajet).toHaveBeenCalledWith(
        expect.objectContaining({
          chauffeur_id: 'supa_chauffeur_1',
          ville_depart: 'Libreville',
          ville_arrivee: 'Franceville',
          prix: 10000,
          marque: 'Toyota',
          modele: 'Hilux',
          couleur: 'Noir',
        })
      );
      expect(useTrajetsStore.getState().trajets[0].id).toBe('supa_t1');
    });

    it('removes local trajet on Supabase error', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      (insertTrajet as jest.Mock).mockRejectedValue(new Error('DB error'));
      useTrajetsStore.setState({
        formData: {
          villeDepart: 'A',
          villeArrivee: 'B',
          prix: '1000',
          vehicule: 'moto',
          date: '',
          placesDisponibles: '1',
          marque: '',
          modele: '',
          couleur: '',
        },
      });

      await useTrajetsStore.getState().addTrajet('c1', 'supa_c1');
      expect(useTrajetsStore.getState().trajets).toHaveLength(0);
    });

    it('does not call Supabase without supabaseProfileId', async () => {
      useTrajetsStore.setState({
        formData: {
          villeDepart: 'A',
          villeArrivee: 'B',
          prix: '500',
          vehicule: 'moto',
          date: '',
          placesDisponibles: '1',
          marque: '',
          modele: '',
          couleur: '',
        },
      });

      await useTrajetsStore.getState().addTrajet('c1');
      expect(insertTrajet).not.toHaveBeenCalled();
    });

    it('uses current date when date is empty', async () => {
      useTrajetsStore.setState({
        formData: {
          villeDepart: 'A',
          villeArrivee: 'B',
          prix: '500',
          vehicule: 'moto',
          date: '',
          placesDisponibles: '1',
          marque: '',
          modele: '',
          couleur: '',
        },
      });

      await useTrajetsStore.getState().addTrajet('c1');
      expect(useTrajetsStore.getState().trajets[0].date).toBeTruthy();
    });

    it('handles invalid prix as 0', async () => {
      useTrajetsStore.setState({
        formData: {
          villeDepart: 'A',
          villeArrivee: 'B',
          prix: 'abc',
          vehicule: 'moto',
          date: '',
          placesDisponibles: 'xyz',
          marque: '',
          modele: '',
          couleur: '',
        },
      });

      await useTrajetsStore.getState().addTrajet('c1');
      expect(useTrajetsStore.getState().trajets[0].prix).toBe(0);
      expect(useTrajetsStore.getState().trajets[0].placesDisponibles).toBe(1);
    });
  });

  describe('removeTrajet', () => {
    it('removes trajet optimistically', async () => {
      useTrajetsStore.setState({
        trajets: [
          { id: '1', chauffeurId: 'c1', villeDepart: 'A', villeArrivee: 'B', prix: 1000, vehicule: 'moto', date: '', placesDisponibles: 1, status: 'en_attente', createdAt: '' },
          { id: '2', chauffeurId: 'c1', villeDepart: 'C', villeArrivee: 'D', prix: 2000, vehicule: 'voiture', date: '', placesDisponibles: 3, status: 'en_attente', createdAt: '' },
        ],
      });

      await useTrajetsStore.getState().removeTrajet('1');
      expect(useTrajetsStore.getState().trajets).toHaveLength(1);
      expect(useTrajetsStore.getState().trajets[0].id).toBe('2');
    });

    it('restores trajet on Supabase error', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      (deleteTrajet as jest.Mock).mockRejectedValue(new Error('error'));
      useTrajetsStore.setState({
        trajets: [
          { id: '1', chauffeurId: 'c1', villeDepart: 'A', villeArrivee: 'B', prix: 1000, vehicule: 'moto', date: '', placesDisponibles: 1, status: 'en_attente', createdAt: '' },
        ],
      });

      await useTrajetsStore.getState().removeTrajet('1');
      expect(useTrajetsStore.getState().trajets).toHaveLength(1);
    });
  });

  describe('markEffectue', () => {
    it('marks trajet as effectue optimistically', async () => {
      useTrajetsStore.setState({
        trajets: [
          { id: '1', chauffeurId: 'c1', villeDepart: 'A', villeArrivee: 'B', prix: 1000, vehicule: 'moto', date: '', placesDisponibles: 1, status: 'en_attente', createdAt: '' },
        ],
      });

      await useTrajetsStore.getState().markEffectue('1');
      expect(useTrajetsStore.getState().trajets[0].status).toBe('effectue');
      expect(markTrajetEffectue).toHaveBeenCalledWith('1');
    });

    it('reverts on Supabase error', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      (markTrajetEffectue as jest.Mock).mockRejectedValue(new Error('error'));
      useTrajetsStore.setState({
        trajets: [
          { id: '1', chauffeurId: 'c1', villeDepart: 'A', villeArrivee: 'B', prix: 1000, vehicule: 'moto', date: '', placesDisponibles: 1, status: 'en_attente', createdAt: '' },
        ],
      });

      await useTrajetsStore.getState().markEffectue('1');
      expect(useTrajetsStore.getState().trajets[0].status).toBe('en_attente');
    });
  });

  describe('loadTrajets', () => {
    it('loads and transforms data from Supabase', async () => {
      (fetchTrajets as jest.Mock).mockResolvedValue([
        {
          id: 't1',
          chauffeur_id: 'c1',
          ville_depart: 'Libreville',
          ville_arrivee: 'Franceville',
          prix: 15000,
          vehicule: 'voiture',
          date: '2026-04-01',
          places_disponibles: 4,
          status: 'en_attente',
          created_at: '2026-03-01',
          marque: 'Toyota',
          modele: 'Hilux',
          couleur: 'Blanc',
        },
      ]);

      await useTrajetsStore.getState().loadTrajets('supa_1');
      const trajets = useTrajetsStore.getState().trajets;
      expect(trajets).toHaveLength(1);
      expect(trajets[0].villeDepart).toBe('Libreville');
      expect(trajets[0].prix).toBe(15000);
      expect(trajets[0].marque).toBe('Toyota');
      expect(trajets[0].modele).toBe('Hilux');
      expect(trajets[0].couleur).toBe('Blanc');
    });

    it('sets isLoading during fetch', async () => {
      let resolvePromise: (value: unknown[]) => void;
      (fetchTrajets as jest.Mock).mockReturnValue(
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
      );

      const promise = useTrajetsStore.getState().loadTrajets('supa_1');
      expect(useTrajetsStore.getState().isLoading).toBe(true);

      resolvePromise!([]);
      await promise;
      expect(useTrajetsStore.getState().isLoading).toBe(false);
    });

    it('handles null date as empty string', async () => {
      (fetchTrajets as jest.Mock).mockResolvedValue([
        {
          id: 't1',
          chauffeur_id: 'c1',
          ville_depart: 'A',
          ville_arrivee: 'B',
          prix: 1000,
          vehicule: 'moto',
          date: null,
          places_disponibles: 1,
          status: 'en_attente',
          created_at: '2026-01-01',
          marque: null,
          modele: null,
          couleur: null,
        },
      ]);

      await useTrajetsStore.getState().loadTrajets('supa_1');
      expect(useTrajetsStore.getState().trajets[0].date).toBe('');
      expect(useTrajetsStore.getState().trajets[0].marque).toBeUndefined();
      expect(useTrajetsStore.getState().trajets[0].modele).toBeUndefined();
      expect(useTrajetsStore.getState().trajets[0].couleur).toBeUndefined();
    });

    it('handles error gracefully', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      (fetchTrajets as jest.Mock).mockRejectedValue(new Error('error'));

      await useTrajetsStore.getState().loadTrajets('supa_1');
      expect(useTrajetsStore.getState().isLoading).toBe(false);
    });
  });
});
