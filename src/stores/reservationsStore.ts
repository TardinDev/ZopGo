import { create } from 'zustand';
import {
  insertReservation,
  fetchReservationsForChauffeur,
  fetchReservationsForClient,
  acceptReservation as acceptReservationApi,
  refuseReservation as refuseReservationApi,
} from '../lib/supabaseReservations';
import { updateTrajetPlaces } from '../lib/supabaseTrajets';
import {
  createNotification,
  getProfilePushToken,
  sendPushNotification,
} from '../lib/supabaseNotificationsCreate';
import type { Reservation } from '../types';

interface ReservationsState {
  clientReservations: Reservation[];
  chauffeurReservations: Reservation[];
  isLoading: boolean;

  bookTrajet: (params: {
    trajetId: string;
    clientId: string;
    chauffeurId: string;
    nombrePlaces: number;
    prixTotal: number;
    clientName: string;
    remainingPlaces: number;
  }) => Promise<Reservation | null>;

  acceptReservation: (params: {
    reservationId: string;
    clientId: string;
    chauffeurName: string;
    chauffeurId: string;
  }) => Promise<boolean>;

  refuseReservation: (params: {
    reservationId: string;
    clientId: string;
    chauffeurId: string;
    trajetId: string;
    nombrePlaces: number;
    currentPlaces: number;
  }) => Promise<boolean>;

  loadClientReservations: (clientId: string) => Promise<void>;
  loadChauffeurReservations: (chauffeurId: string) => Promise<void>;
}

export const useReservationsStore = create<ReservationsState>((set) => ({
  clientReservations: [],
  chauffeurReservations: [],
  isLoading: false,

  bookTrajet: async ({
    trajetId,
    clientId,
    chauffeurId,
    nombrePlaces,
    prixTotal,
    clientName,
    remainingPlaces,
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

      // Decrement places on trajet
      const newPlaces = Math.max(0, remainingPlaces - nombrePlaces);
      await updateTrajetPlaces(trajetId, newPlaces);

      // Create notification for chauffeur
      await createNotification({
        recipient_id: chauffeurId,
        type: 'reservation',
        title: 'Nouvelle réservation',
        message: `${clientName} souhaite réserver ${nombrePlaces} place${nombrePlaces > 1 ? 's' : ''} pour votre trajet`,
        icon: 'calendar-check',
        icon_color: '#2162FE',
        icon_bg: '#DBEAFE',
        data: {
          reservationId: reservation.id,
          clientId,
          clientName,
          trajetId,
        },
      });

      // Send push notification to chauffeur
      const pushToken = await getProfilePushToken(chauffeurId);
      if (pushToken) {
        await sendPushNotification(
          pushToken,
          'Nouvelle réservation',
          `${clientName} souhaite réserver ${nombrePlaces} place(s)`,
          { reservationId: reservation.id, type: 'reservation' }
        );
      }

      return reservation;
    } catch (err) {
      if (__DEV__) console.error('bookTrajet error:', err);
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  acceptReservation: async ({ reservationId, clientId, chauffeurName, chauffeurId }) => {
    set({ isLoading: true });
    try {
      const ok = await acceptReservationApi(reservationId);
      if (!ok) return false;

      await createNotification({
        recipient_id: clientId,
        type: 'reservation_acceptee',
        title: 'Réservation acceptée',
        message: `${chauffeurName} a accepté votre réservation`,
        icon: 'check-circle',
        icon_color: '#10B981',
        icon_bg: '#D1FAE5',
        data: {
          reservationId,
          chauffeurId,
          chauffeurName,
        },
      });

      const pushToken = await getProfilePushToken(clientId);
      if (pushToken) {
        await sendPushNotification(
          pushToken,
          'Réservation acceptée',
          `${chauffeurName} a accepté votre réservation`,
          { reservationId, type: 'reservation_acceptee' }
        );
      }

      // Update local state
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
  }) => {
    set({ isLoading: true });
    try {
      const ok = await refuseReservationApi(reservationId);
      if (!ok) return false;

      // Re-increment places
      await updateTrajetPlaces(trajetId, currentPlaces + nombrePlaces);

      await createNotification({
        recipient_id: clientId,
        type: 'reservation_refusee',
        title: 'Réservation refusée',
        message: 'Le chauffeur a refusé votre réservation',
        icon: 'close-circle',
        icon_color: '#EF4444',
        icon_bg: '#FEE2E2',
        data: {
          reservationId,
          chauffeurId,
          trajetId,
        },
      });

      const pushToken = await getProfilePushToken(clientId);
      if (pushToken) {
        await sendPushNotification(
          pushToken,
          'Réservation refusée',
          'Le chauffeur a refusé votre réservation',
          { reservationId, type: 'reservation_refusee' }
        );
      }

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
}));
