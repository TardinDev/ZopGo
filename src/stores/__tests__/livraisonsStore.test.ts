import { useLivraisonsStore } from '../livraisonsStore';

beforeEach(() => {
  useLivraisonsStore.setState({
    pickupLocation: '',
    dropoffLocation: '',
    showResults: false,
    selectedLivreur: null,
    waitingForAcceptance: false,
    accepted: false,
    noResponse: false,
  });
});

describe('livraisonsStore', () => {
  describe('initial state', () => {
    it('starts with empty locations', () => {
      const state = useLivraisonsStore.getState();
      expect(state.pickupLocation).toBe('');
      expect(state.dropoffLocation).toBe('');
    });

    it('starts with all flags false', () => {
      const state = useLivraisonsStore.getState();
      expect(state.showResults).toBe(false);
      expect(state.waitingForAcceptance).toBe(false);
      expect(state.accepted).toBe(false);
      expect(state.noResponse).toBe(false);
    });

    it('starts with no selected livreur', () => {
      expect(useLivraisonsStore.getState().selectedLivreur).toBeNull();
    });
  });

  describe('setPickupLocation', () => {
    it('updates pickup location', () => {
      useLivraisonsStore.getState().setPickupLocation('Libreville Centre');
      expect(useLivraisonsStore.getState().pickupLocation).toBe('Libreville Centre');
    });
  });

  describe('setDropoffLocation', () => {
    it('updates dropoff location', () => {
      useLivraisonsStore.getState().setDropoffLocation('Owendo');
      expect(useLivraisonsStore.getState().dropoffLocation).toBe('Owendo');
    });
  });

  describe('setShowResults', () => {
    it('shows results', () => {
      useLivraisonsStore.getState().setShowResults(true);
      expect(useLivraisonsStore.getState().showResults).toBe(true);
    });
  });

  describe('setSelectedLivreur', () => {
    it('selects a livreur', () => {
      useLivraisonsStore.getState().setSelectedLivreur('livreur_1');
      expect(useLivraisonsStore.getState().selectedLivreur).toBe('livreur_1');
    });

    it('deselects livreur with null', () => {
      useLivraisonsStore.getState().setSelectedLivreur('livreur_1');
      useLivraisonsStore.getState().setSelectedLivreur(null);
      expect(useLivraisonsStore.getState().selectedLivreur).toBeNull();
    });
  });

  describe('setWaitingForAcceptance', () => {
    it('sets waiting state', () => {
      useLivraisonsStore.getState().setWaitingForAcceptance(true);
      expect(useLivraisonsStore.getState().waitingForAcceptance).toBe(true);
    });
  });

  describe('setAccepted', () => {
    it('sets accepted state', () => {
      useLivraisonsStore.getState().setAccepted(true);
      expect(useLivraisonsStore.getState().accepted).toBe(true);
    });
  });

  describe('setNoResponse', () => {
    it('sets no response state', () => {
      useLivraisonsStore.getState().setNoResponse(true);
      expect(useLivraisonsStore.getState().noResponse).toBe(true);
    });
  });

  describe('resetSearch', () => {
    it('resets search-related state', () => {
      useLivraisonsStore.getState().setPickupLocation('Libreville');
      useLivraisonsStore.getState().setDropoffLocation('Owendo');
      useLivraisonsStore.getState().setShowResults(true);
      useLivraisonsStore.getState().setSelectedLivreur('livreur_1');

      useLivraisonsStore.getState().resetSearch();
      const state = useLivraisonsStore.getState();
      expect(state.showResults).toBe(false);
      expect(state.selectedLivreur).toBeNull();
    });

    it('preserves locations', () => {
      useLivraisonsStore.getState().setPickupLocation('Libreville');
      useLivraisonsStore.getState().setDropoffLocation('Owendo');
      useLivraisonsStore.getState().resetSearch();
      expect(useLivraisonsStore.getState().pickupLocation).toBe('Libreville');
      expect(useLivraisonsStore.getState().dropoffLocation).toBe('Owendo');
    });
  });

  describe('resetAll', () => {
    it('resets everything to initial state', () => {
      useLivraisonsStore.getState().setPickupLocation('Libreville');
      useLivraisonsStore.getState().setDropoffLocation('Owendo');
      useLivraisonsStore.getState().setShowResults(true);
      useLivraisonsStore.getState().setSelectedLivreur('livreur_1');
      useLivraisonsStore.getState().setWaitingForAcceptance(true);
      useLivraisonsStore.getState().setAccepted(true);
      useLivraisonsStore.getState().setNoResponse(true);

      useLivraisonsStore.getState().resetAll();
      const state = useLivraisonsStore.getState();
      expect(state.pickupLocation).toBe('');
      expect(state.dropoffLocation).toBe('');
      expect(state.showResults).toBe(false);
      expect(state.selectedLivreur).toBeNull();
      expect(state.waitingForAcceptance).toBe(false);
      expect(state.accepted).toBe(false);
      expect(state.noResponse).toBe(false);
    });
  });
});
