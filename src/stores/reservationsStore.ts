import { create } from 'zustand';
import {
  insertReservation,
  fetchReservationsForChauffeur,
  fetchReservationsForClient,
  acceptReservation as acceptReservationApi,
  refuseReservation as refuseReservationApi,
} from '../lib/supabaseReservations';
import {
  insertHebergementReservation,
  acceptHebergementReservation as acceptHebResApi,
  refuseHebergementReservation as refuseHebResApi,
  fetchHebergementReservationsForClient,
  fetchHebergementReservationsForHebergeur,
} from '../lib/supabaseHebergementReservations';
import { updateTrajetPlaces } from '../lib/supabaseTrajets';
import { updateHebergementDisponibilite } from '../lib/supabaseHebergements';
import { sendPushIfAllowed } from '../lib/pushNotifications';
import type { Reservation, HebergementReservation } from '../types';

interface ReservationsState {
  clientReservations: Reservation[];
  chauffeurReservations: Reservation[];
  clientHebergementReservations: HebergementReservation[];
  hebergeurHebergementReservations: HebergementReservation[];
  isLoading: boolean;

  bookTrajet: (params: {
    trajetId: string;
    clientId: string;
    chauffeurId: string;
    nombrePlaces: number;
    prixTotal: number;
    clientName: string;
    remainingPlaces: number;
    villeDepart?: string;
    villeArrivee?: string;
  }) => Promise<Reservation | null>;

  acceptReservation: (params: {
    reservationId: string;
    clientId: string;
    chauffeurName: string;
    chauffeurId: string;
    villeDepart?: string;
    villeArrivee?: string;
  }) => Promise<boolean>;

  refuseReservation: (params: {
    reservationId: string;
    clientId: string;
    chauffeurId: string;
    trajetId: string;
    nombrePlaces: number;
    currentPlaces: number;
    villeDepart?: string;
    villeArrivee?: string;
  }) => Promise<boolean>;

  bookHebergement: (params: {
    hebergementId: string;
    clientId: string;
    hebergeurId: string;
    nombreNuits: number;
    prixTotal: number;
    clientName: string;
    currentDisponibilite: number;
    hebergementNom: string;
    hebergementVille: string;
  }) => Promise<HebergementReservation | null>;

  acceptHebergementReservation: (params: {
    reservationId: string;
    clientId: string;
    hebergeurName: string;
    hebergeurId: string;
    hebergementNom?: string;
    hebergementVille?: string;
  }) => Promise<boolean>;

  refuseHebergementReservation: (params: {
    reservationId: string;
    clientId: string;
    hebergeurId: string;
    hebergementId: string;
    currentDisponibilite: number;
    hebergementNom?: string;
    hebergementVille?: string;
  }) => Promise<boolean>;

  loadClientReservations: (clientId: string) => Promise<void>;
  loadChauffeurReservations: (chauffeurId: string) => Promise<void>;
  loadClientHebergementReservations: (clientId: string) => Promise<void>;
  loadHebergeurHebergementReservations: (hebergeurId: string) => Promise<void>;
}

export const useReservationsStore = create<ReservationsState>((set) => ({
  clientReservations: [],
  chauffeurReservations: [],
  clientHebergementReservations: [],
  hebergeurHebergementReservations: [],
  isLoading: false,

  // ── Trajets ──

  bookTrajet: async ({
    trajetId,
    clientId,
    chauffeurId,
    nombrePlaces,
    prixTotal,
    clientName,
    remainingPlaces,
    villeDepart,
    villeArrivee,
  }) => {
    set({ isLoading: true });
    try {
      const reservation = await insertReservation({
        trajet_id: trajetId,
        client_id: clientId,
        chauffeur_id: chauffeurId,
        nombre_places: nombrePlaces,
        prix_total: prixTotal,
      });

      if (!reservation) {
        return null;
      }

      const newPlaces = Math.max(0, remainingPlaces - nombrePlaces);
      await updateTrajetPlaces(trajetId, newPlaces);

      const routeLabel = villeDepart && villeArrivee ? `${villeDepart} → ${villeArrivee}` : '';
      const pushBody = routeLabel
        ? `${clientName} souhaite réserver ${nombrePlaces} place(s) — ${routeLabel}`
        : `${clientName} souhaite réserver ${nombrePlaces} place(s)`;

      void sendPushIfAllowed({
        recipientProfileId: chauffeurId,
        category: 'trajets',
        type: 'reservation',
        title: 'Nouvelle réservation',
        body: pushBody,
        message: `${clientName} souhaite réserver ${nombrePlaces} place${nombrePlaces > 1 ? 's' : ''} pour votre trajet`,
        icon: 'calendar-check',
        data: {
          reservationId: reservation.id,
          clientId,
          clientName,
          trajetId,
          ...(villeDepart && { villeDepart }),
          ...(villeArrivee && { villeArrivee }),
        },
      });

      return reservation;
    } catch (err) {
      if (__DEV__) console.error('bookTrajet error:', err);
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  acceptReservation: async ({ reservationId, clientId, chauffeurName, chauffeurId, villeDepart, villeArrivee }) => {
    set({ isLoading: true });
    try {
      const ok = await acceptReservationApi(reservationId);
      if (!ok) return false;

      const routeLabel = villeDepart && villeArrivee ? `${villeDepart} → ${villeArrivee}` : '';
      const pushBody = routeLabel
        ? `${chauffeurName} a accepté votre réservation — ${routeLabel}`
        : `${chauffeurName} a accepté votre réservation`;

      void sendPushIfAllowed({
        recipientProfileId: clientId,
        category: 'trajets',
        type: 'reservation_acceptee',
        title: 'Réservation acceptée',
        body: pushBody,
        message: `${chauffeurName} a accepté votre réservation`,
        icon: 'check-circle',
        iconColor: '#10B981',
        iconBg: '#D1FAE5',
        data: {
          reservationId,
          chauffeurId,
          chauffeurName,
          ...(villeDepart && { villeDepart }),
          ...(villeArrivee && { villeArrivee }),
        },
      });

      set((state) => ({
        chauffeurReservations: state.chauffeurReservations.map((r) =>
          r.id === reservationId ? { ...r, status: 'acceptee' } : r
        ),
      }));

      return true;
    } catch (err) {
      if (__DEV__) console.error('acceptReservation error:', err);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  refuseReservation: async ({
    reservationId,
    clientId,
    chauffeurId,
    trajetId,
    nombrePlaces,
    currentPlaces,
    villeDepart,
    villeArrivee,
  }) => {
    set({ isLoading: true });
    try {
      const ok = await refuseReservationApi(reservationId);
      if (!ok) return false;

      await updateTrajetPlaces(trajetId, currentPlaces + nombrePlaces);

      const routeLabel = villeDepart && villeArrivee ? `${villeDepart} → ${villeArrivee}` : '';
      const pushBody = routeLabel
        ? `Le chauffeur a refusé votre réservation — ${routeLabel}`
        : 'Le chauffeur a refusé votre réservation';

      void sendPushIfAllowed({
        recipientProfileId: clientId,
        category: 'trajets',
        type: 'reservation_refusee',
        title: 'Réservation refusée',
        body: pushBody,
        message: 'Le chauffeur a refusé votre réservation',
        icon: 'close-circle',
        iconColor: '#EF4444',
        iconBg: '#FEE2E2',
        data: {
          reservationId,
          chauffeurId,
          trajetId,
          ...(villeDepart && { villeDepart }),
          ...(villeArrivee && { villeArrivee }),
        },
      });

      set((state) => ({
        chauffeurReservations: state.chauffeurReservations.map((r) =>
          r.id === reservationId ? { ...r, status: 'refusee' } : r
        ),
      }));

      return true;
    } catch (err) {
      if (__DEV__) console.error('refuseReservation error:', err);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Hébergements ──

  bookHebergement: async ({
    hebergementId,
    clientId,
    hebergeurId,
    nombreNuits,
    prixTotal,
    clientName,
    currentDisponibilite,
    hebergementNom,
    hebergementVille,
  }) => {
    set({ isLoading: true });
    try {
      const reservation = await insertHebergementReservation({
        hebergement_id: hebergementId,
        client_id: clientId,
        hebergeur_id: hebergeurId,
        nombre_nuits: nombreNuits,
        prix_total: prixTotal,
      });

      if (!reservation) {
        return null;
      }

      // Décrémenter la disponibilité
      const newDispo = Math.max(0, currentDisponibilite - 1);
      await updateHebergementDisponibilite(hebergementId, newDispo);

      const contextLabel = `${hebergementNom} — ${hebergementVille}`;

      void sendPushIfAllowed({
        recipientProfileId: hebergeurId,
        category: 'hebergements',
        type: 'hebergement_reservation',
        title: 'Nouvelle demande',
        body: `${clientName} souhaite réserver ${nombreNuits} nuit(s) — ${contextLabel}`,
        message: `${clientName} souhaite réserver ${nombreNuits} nuit${nombreNuits > 1 ? 's' : ''} dans votre hébergement`,
        icon: 'bed-outline',
        data: {
          hebergementReservationId: reservation.id,
          clientId,
          clientName,
          hebergementId,
          hebergementNom,
          hebergementVille,
        },
      });

      return reservation;
    } catch (err) {
      if (__DEV__) console.error('bookHebergement error:', err);
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  acceptHebergementReservation: async ({
    reservationId,
    clientId,
    hebergeurName,
    hebergeurId,
    hebergementNom,
    hebergementVille,
  }) => {
    set({ isLoading: true });
    try {
      const ok = await acceptHebResApi(reservationId);
      if (!ok) return false;

      const contextLabel = hebergementNom && hebergementVille
        ? `${hebergementNom} — ${hebergementVille}`
        : '';
      const pushBody = contextLabel
        ? `${hebergeurName} a accepté votre demande — ${contextLabel}`
        : `${hebergeurName} a accepté votre demande d'hébergement`;

      void sendPushIfAllowed({
        recipientProfileId: clientId,
        category: 'hebergements',
        type: 'hebergement_reservation_acceptee',
        title: 'Demande acceptée',
        body: pushBody,
        message: `${hebergeurName} a accepté votre demande d'hébergement`,
        icon: 'check-circle',
        iconColor: '#10B981',
        iconBg: '#D1FAE5',
        data: {
          hebergementReservationId: reservationId,
          hebergeurId,
          hebergeurName,
          ...(hebergementNom && { hebergementNom }),
          ...(hebergementVille && { hebergementVille }),
        },
      });

      set((state) => ({
        hebergeurHebergementReservations: state.hebergeurHebergementReservations.map((r) =>
          r.id === reservationId ? { ...r, status: 'acceptee' } : r
        ),
      }));

      return true;
    } catch (err) {
      if (__DEV__) console.error('acceptHebergementReservation error:', err);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  refuseHebergementReservation: async ({
    reservationId,
    clientId,
    hebergeurId,
    hebergementId,
    currentDisponibilite,
    hebergementNom,
    hebergementVille,
  }) => {
    set({ isLoading: true });
    try {
      const ok = await refuseHebResApi(reservationId);
      if (!ok) return false;

      // Restaurer la disponibilité
      await updateHebergementDisponibilite(hebergementId, currentDisponibilite + 1);

      const contextLabel = hebergementNom && hebergementVille
        ? `${hebergementNom} — ${hebergementVille}`
        : '';
      const pushBody = contextLabel
        ? `L'hébergeur a refusé votre demande — ${contextLabel}`
        : "L'hébergeur a refusé votre demande";

      void sendPushIfAllowed({
        recipientProfileId: clientId,
        category: 'hebergements',
        type: 'hebergement_reservation_refusee',
        title: 'Demande refusée',
        body: pushBody,
        message: "L'hébergeur a refusé votre demande",
        icon: 'close-circle',
        iconColor: '#EF4444',
        iconBg: '#FEE2E2',
        data: {
          hebergementReservationId: reservationId,
          hebergeurId,
          hebergementId,
          ...(hebergementNom && { hebergementNom }),
          ...(hebergementVille && { hebergementVille }),
        },
      });

      set((state) => ({
        hebergeurHebergementReservations: state.hebergeurHebergementReservations.map((r) =>
          r.id === reservationId ? { ...r, status: 'refusee' } : r
        ),
      }));

      return true;
    } catch (err) {
      if (__DEV__) console.error('refuseHebergementReservation error:', err);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Loaders ──

  loadClientReservations: async (clientId) => {
    set({ isLoading: true });
    try {
      const data = await fetchReservationsForClient(clientId);
      set({ clientReservations: data });
    } catch (err) {
      if (__DEV__) console.error('loadClientReservations error:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  loadChauffeurReservations: async (chauffeurId) => {
    set({ isLoading: true });
    try {
      const data = await fetchReservationsForChauffeur(chauffeurId);
      set({ chauffeurReservations: data });
    } catch (err) {
      if (__DEV__) console.error('loadChauffeurReservations error:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  loadClientHebergementReservations: async (clientId) => {
    set({ isLoading: true });
    try {
      const data = await fetchHebergementReservationsForClient(clientId);
      set({ clientHebergementReservations: data });
    } catch (err) {
      if (__DEV__) console.error('loadClientHebergementReservations error:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  loadHebergeurHebergementReservations: async (hebergeurId) => {
    set({ isLoading: true });
    try {
      const data = await fetchHebergementReservationsForHebergeur(hebergeurId);
      set({ hebergeurHebergementReservations: data });
    } catch (err) {
      if (__DEV__) console.error('loadHebergeurHebergementReservations error:', err);
    } finally {
      set({ isLoading: false });
    }
  },
}));
