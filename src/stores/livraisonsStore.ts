import { create } from 'zustand';
import {
  insertLivraison,
  fetchLivraisonsForClient,
  fetchLivraisonsForLivreur,
  fetchLivraisonById,
  acceptLivraison,
  refuseLivraison,
  markLivraisonEnCours,
  markLivraisonLivree,
  cancelLivraison,
} from '../lib/supabaseLivraisons';
import { sendPushIfAllowed } from '../lib/pushNotifications';
import type { Livraison } from '../types';

interface LivraisonsState {
  // ── UI state (legacy, preserved for livraisons.tsx) ────────────
  pickupLocation: string;
  dropoffLocation: string;
  showResults: boolean;
  selectedLivreur: string | null;
  waitingForAcceptance: boolean;
  accepted: boolean;
  noResponse: boolean;

  // ── Backend state ──────────────────────────────────────────────
  currentLivraison: Livraison | null;
  clientLivraisons: Livraison[];
  livreurLivraisons: Livraison[];
  isLoading: boolean;

  // UI setters
  setPickupLocation: (location: string) => void;
  setDropoffLocation: (location: string) => void;
  setShowResults: (show: boolean) => void;
  setSelectedLivreur: (id: string | null) => void;
  setWaitingForAcceptance: (waiting: boolean) => void;
  setAccepted: (accepted: boolean) => void;
  setNoResponse: (noResponse: boolean) => void;
  resetSearch: () => void;
  resetAll: () => void;

  // Backend actions
  createLivraisonRequest: (params: {
    clientId: string;
    livreurProfileId: string;
    pickupLocation: string;
    dropoffLocation: string;
    description?: string;
    prixEstime?: number;
    clientName: string;
  }) => Promise<Livraison | null>;

  loadClientLivraisons: (clientId: string) => Promise<void>;
  loadLivreurLivraisons: (livreurId: string) => Promise<void>;
  refreshCurrentLivraison: (id: string) => Promise<void>;

  acceptLivraisonAction: (params: {
    livraisonId: string;
    clientId: string;
    livreurName: string;
  }) => Promise<boolean>;

  refuseLivraisonAction: (params: {
    livraisonId: string;
    clientId: string;
  }) => Promise<boolean>;

  startLivraisonAction: (params: {
    livraisonId: string;
    clientId: string;
    livreurName: string;
  }) => Promise<boolean>;

  completeLivraisonAction: (params: {
    livraisonId: string;
    clientId: string;
  }) => Promise<boolean>;

  cancelLivraisonAction: (params: {
    livraisonId: string;
    livreurProfileId: string;
  }) => Promise<boolean>;
}

export const useLivraisonsStore = create<LivraisonsState>((set, get) => ({
  // UI state
  pickupLocation: '',
  dropoffLocation: '',
  showResults: false,
  selectedLivreur: null,
  waitingForAcceptance: false,
  accepted: false,
  noResponse: false,

  // Backend state
  currentLivraison: null,
  clientLivraisons: [],
  livreurLivraisons: [],
  isLoading: false,

  // UI setters
  setPickupLocation: (location) => set({ pickupLocation: location }),
  setDropoffLocation: (location) => set({ dropoffLocation: location }),
  setShowResults: (show) => set({ showResults: show }),
  setSelectedLivreur: (id) => set({ selectedLivreur: id }),
  setWaitingForAcceptance: (waiting) => set({ waitingForAcceptance: waiting }),
  setAccepted: (accepted) => set({ accepted }),
  setNoResponse: (noResponse) => set({ noResponse }),

  resetSearch: () =>
    set({
      showResults: false,
      selectedLivreur: null,
    }),

  resetAll: () =>
    set({
      pickupLocation: '',
      dropoffLocation: '',
      showResults: false,
      selectedLivreur: null,
      waitingForAcceptance: false,
      accepted: false,
      noResponse: false,
      currentLivraison: null,
    }),

  // ── Backend actions ──

  createLivraisonRequest: async ({
    clientId,
    livreurProfileId,
    pickupLocation,
    dropoffLocation,
    description,
    prixEstime,
    clientName,
  }) => {
    set({ isLoading: true });
    try {
      const livraison = await insertLivraison({
        client_id: clientId,
        livreur_id: livreurProfileId,
        pickup_location: pickupLocation,
        dropoff_location: dropoffLocation,
        description,
        prix_estime: prixEstime,
      });

      if (!livraison) return null;

      set({ currentLivraison: livraison });

      // Notify the livreur
      void sendPushIfAllowed({
        recipientProfileId: livreurProfileId,
        category: 'courses',
        type: 'livraison_new',
        title: 'Nouvelle demande de livraison',
        body: `${clientName} — ${pickupLocation} → ${dropoffLocation}`,
        message: `${clientName} souhaite une livraison`,
        icon: 'cube',
        data: {
          livraisonId: livraison.id,
          clientId,
          type: 'livraison_new',
        },
      });

      return livraison;
    } catch (err) {
      if (__DEV__) console.error('createLivraisonRequest error:', err);
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  loadClientLivraisons: async (clientId) => {
    set({ isLoading: true });
    try {
      const data = await fetchLivraisonsForClient(clientId);
      set({ clientLivraisons: data });
    } catch (err) {
      if (__DEV__) console.error('loadClientLivraisons error:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  loadLivreurLivraisons: async (livreurId) => {
    set({ isLoading: true });
    try {
      const data = await fetchLivraisonsForLivreur(livreurId);
      set({ livreurLivraisons: data });
    } catch (err) {
      if (__DEV__) console.error('loadLivreurLivraisons error:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  refreshCurrentLivraison: async (id) => {
    const livraison = await fetchLivraisonById(id);
    if (livraison) {
      set({ currentLivraison: livraison });
    }
  },

  acceptLivraisonAction: async ({ livraisonId, clientId, livreurName }) => {
    const ok = await acceptLivraison(livraisonId);
    if (!ok) return false;

    set((state) => ({
      currentLivraison:
        state.currentLivraison && state.currentLivraison.id === livraisonId
          ? { ...state.currentLivraison, status: 'acceptee' }
          : state.currentLivraison,
    }));

    void sendPushIfAllowed({
      recipientProfileId: clientId,
      category: 'courses',
      type: 'livraison_acceptee',
      title: 'Livraison acceptée',
      body: `${livreurName} a accepté votre demande`,
      icon: 'checkmark-circle',
      iconColor: '#10B981',
      iconBg: '#D1FAE5',
      data: { livraisonId, type: 'livraison_acceptee' },
    });

    return true;
  },

  refuseLivraisonAction: async ({ livraisonId, clientId }) => {
    const ok = await refuseLivraison(livraisonId);
    if (!ok) return false;

    set((state) => ({
      currentLivraison:
        state.currentLivraison && state.currentLivraison.id === livraisonId
          ? { ...state.currentLivraison, status: 'refusee' }
          : state.currentLivraison,
    }));

    void sendPushIfAllowed({
      recipientProfileId: clientId,
      category: 'courses',
      type: 'livraison_refusee',
      title: 'Livreur indisponible',
      body: 'Votre demande de livraison a été refusée',
      icon: 'close-circle',
      iconColor: '#EF4444',
      iconBg: '#FEE2E2',
      data: { livraisonId, type: 'livraison_refusee' },
    });

    return true;
  },

  startLivraisonAction: async ({ livraisonId, clientId, livreurName }) => {
    const ok = await markLivraisonEnCours(livraisonId);
    if (!ok) return false;

    set((state) => ({
      currentLivraison:
        state.currentLivraison && state.currentLivraison.id === livraisonId
          ? { ...state.currentLivraison, status: 'en_cours' }
          : state.currentLivraison,
    }));

    void sendPushIfAllowed({
      recipientProfileId: clientId,
      category: 'courses',
      type: 'livraison_en_cours',
      title: 'Livraison en cours',
      body: `${livreurName} est en route`,
      icon: 'bicycle',
      data: { livraisonId, type: 'livraison_en_cours' },
    });

    return true;
  },

  completeLivraisonAction: async ({ livraisonId, clientId }) => {
    const ok = await markLivraisonLivree(livraisonId);
    if (!ok) return false;

    set((state) => ({
      currentLivraison:
        state.currentLivraison && state.currentLivraison.id === livraisonId
          ? { ...state.currentLivraison, status: 'livree' }
          : state.currentLivraison,
    }));

    void sendPushIfAllowed({
      recipientProfileId: clientId,
      category: 'courses',
      type: 'livraison_livree',
      title: 'Colis livré',
      body: 'Votre colis a été livré — notez votre livreur',
      icon: 'checkmark-done-circle',
      iconColor: '#10B981',
      iconBg: '#D1FAE5',
      data: { livraisonId, type: 'livraison_livree' },
    });

    return true;
  },

  cancelLivraisonAction: async ({ livraisonId, livreurProfileId }) => {
    const ok = await cancelLivraison(livraisonId);
    if (!ok) return false;

    set((state) => ({
      currentLivraison:
        state.currentLivraison && state.currentLivraison.id === livraisonId
          ? { ...state.currentLivraison, status: 'annulee' }
          : state.currentLivraison,
    }));

    void sendPushIfAllowed({
      recipientProfileId: livreurProfileId,
      category: 'courses',
      type: 'livraison_annulee',
      title: 'Demande annulée',
      body: 'Le client a annulé la demande de livraison',
      icon: 'close-circle',
      iconColor: '#EF4444',
      iconBg: '#FEE2E2',
      data: { livraisonId, type: 'livraison_annulee' },
    });

    return true;
  },
}));

// Use the latest current livraison id so that the state ref doesn't get lost
// between renders when realtime events arrive. Exposed for the screen code.
export function getCurrentLivraisonId(): string | null {
  const state = useLivraisonsStore.getState();
  return state.currentLivraison?.id ?? null;
}
