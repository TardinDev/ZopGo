import { useReservationsStore } from '../reservationsStore';
import {
  insertReservation,
  fetchReservationsForChauffeur,
  fetchReservationsForClient,
  fetchReservationById,
  acceptReservation as acceptApi,
  refuseReservation as refuseApi,
} from '../../lib/supabaseReservations';
import { decrementTrajetPlaces, updateTrajetPlaces } from '../../lib/supabaseTrajets';
import { sendPushIfAllowed } from '../../lib/pushNotifications';

beforeEach(() => {
  jest.clearAllMocks();
  useReservationsStore.setState({
    clientReservations: [],
    chauffeurReservations: [],
    isLoading: false,
  });
});

describe('reservationsStore', () => {
  describe('bookTrajet', () => {
    it('creates reservation and notifies chauffeur WITHOUT decrementing places', async () => {
      (insertReservation as jest.Mock).mockResolvedValue({
        id: 'res-1',
        trajetId: 't1',
        clientId: 'c1',
        chauffeurId: 'cf1',
        nombrePlaces: 2,
        prixTotal: 10000,
        status: 'en_attente',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      });

      const result = await useReservationsStore.getState().bookTrajet({
        trajetId: 't1',
        clientId: 'c1',
        chauffeurId: 'cf1',
        nombrePlaces: 2,
        prixTotal: 10000,
        clientName: 'Alice',
      });

      expect(result).not.toBeNull();
      expect(insertReservation).toHaveBeenCalled();
      // Régression: bookTrajet ne doit PAS décrémenter les places (sinon le
      // trajet bascule prématurément en 'complet' avant l'acceptation chauffeur).
      expect(updateTrajetPlaces).not.toHaveBeenCalled();
      expect(decrementTrajetPlaces).not.toHaveBeenCalled();
      expect(sendPushIfAllowed).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientProfileId: 'cf1',
          category: 'trajets',
          type: 'reservation',
        })
      );
    });

    it('returns null when insertReservation fails', async () => {
      (insertReservation as jest.Mock).mockResolvedValue(null);

      const result = await useReservationsStore.getState().bookTrajet({
        trajetId: 't1',
        clientId: 'c1',
        chauffeurId: 'cf1',
        nombrePlaces: 1,
        prixTotal: 5000,
        clientName: 'Alice',
      });

      expect(result).toBeNull();
      expect(updateTrajetPlaces).not.toHaveBeenCalled();
      expect(decrementTrajetPlaces).not.toHaveBeenCalled();
    });

    it('still triggers push helper even when token is absent (helper handles filtering)', async () => {
      (insertReservation as jest.Mock).mockResolvedValue({
        id: 'res-2',
        trajetId: 't1',
        clientId: 'c1',
        chauffeurId: 'cf1',
        nombrePlaces: 1,
        prixTotal: 5000,
        status: 'en_attente',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      });
      (sendPushIfAllowed as jest.Mock).mockResolvedValue({
        inAppCreated: true,
        pushSent: false,
        skippedReason: 'no_token',
      });

      await useReservationsStore.getState().bookTrajet({
        trajetId: 't1',
        clientId: 'c1',
        chauffeurId: 'cf1',
        nombrePlaces: 1,
        prixTotal: 5000,
        clientName: 'Alice',
      });

      expect(sendPushIfAllowed).toHaveBeenCalled();
    });
  });

  describe('acceptReservation', () => {
    it('accepts, decrements trajet places, notifies client, and updates local state', async () => {
      (acceptApi as jest.Mock).mockResolvedValue(true);
      (fetchReservationById as jest.Mock).mockResolvedValue({
        trajetId: 't1',
        nombrePlaces: 2,
      });
      (decrementTrajetPlaces as jest.Mock).mockResolvedValue(true);

      useReservationsStore.setState({
        chauffeurReservations: [
          {
            id: 'res-1',
            trajetId: 't1',
            clientId: 'c1',
            chauffeurId: 'cf1',
            nombrePlaces: 2,
            prixTotal: 5000,
            status: 'en_attente',
            createdAt: '',
            updatedAt: '',
          },
        ],
      });

      const ok = await useReservationsStore.getState().acceptReservation({
        reservationId: 'res-1',
        clientId: 'c1',
        chauffeurName: 'Bob',
        chauffeurId: 'cf1',
      });

      expect(ok).toBe(true);
      expect(acceptApi).toHaveBeenCalledWith('res-1');
      expect(fetchReservationById).toHaveBeenCalledWith('res-1');
      expect(decrementTrajetPlaces).toHaveBeenCalledWith('t1', 2);
      expect(sendPushIfAllowed).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientProfileId: 'c1',
          category: 'trajets',
          type: 'reservation_acceptee',
        })
      );
      expect(useReservationsStore.getState().chauffeurReservations[0].status).toBe('acceptee');
    });

    it('returns false when API fails and does not decrement places', async () => {
      (acceptApi as jest.Mock).mockResolvedValue(false);
      (fetchReservationById as jest.Mock).mockResolvedValue({
        trajetId: 't1',
        nombrePlaces: 1,
      });

      const ok = await useReservationsStore.getState().acceptReservation({
        reservationId: 'res-1',
        clientId: 'c1',
        chauffeurName: 'Bob',
        chauffeurId: 'cf1',
      });

      expect(ok).toBe(false);
      expect(decrementTrajetPlaces).not.toHaveBeenCalled();
      expect(sendPushIfAllowed).not.toHaveBeenCalled();
    });
  });

  describe('refuseReservation', () => {
    it('refuses and notifies client WITHOUT touching trajet places', async () => {
      (refuseApi as jest.Mock).mockResolvedValue(true);

      const ok = await useReservationsStore.getState().refuseReservation({
        reservationId: 'res-1',
        clientId: 'c1',
        chauffeurId: 'cf1',
      });

      expect(ok).toBe(true);
      // Régression: refuseReservation ne doit plus restaurer les places
      // car elles ne sont plus décrémentées au moment de la réservation.
      expect(updateTrajetPlaces).not.toHaveBeenCalled();
      expect(decrementTrajetPlaces).not.toHaveBeenCalled();
      expect(sendPushIfAllowed).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientProfileId: 'c1',
          category: 'trajets',
          type: 'reservation_refusee',
        })
      );
    });

    it('returns false when API fails', async () => {
      (refuseApi as jest.Mock).mockResolvedValue(false);

      const ok = await useReservationsStore.getState().refuseReservation({
        reservationId: 'res-1',
        clientId: 'c1',
        chauffeurId: 'cf1',
      });

      expect(ok).toBe(false);
    });
  });

  describe('loadClientReservations', () => {
    it('loads reservations for a client', async () => {
      (fetchReservationsForClient as jest.Mock).mockResolvedValue([
        {
          id: 'res-1',
          trajetId: 't1',
          clientId: 'c1',
          chauffeurId: 'cf1',
          nombrePlaces: 1,
          prixTotal: 5000,
          status: 'en_attente',
          createdAt: '',
          updatedAt: '',
        },
      ]);

      await useReservationsStore.getState().loadClientReservations('c1');
      expect(useReservationsStore.getState().clientReservations).toHaveLength(1);
    });
  });

  describe('loadChauffeurReservations', () => {
    it('loads reservations for a chauffeur', async () => {
      (fetchReservationsForChauffeur as jest.Mock).mockResolvedValue([
        {
          id: 'res-1',
          trajetId: 't1',
          clientId: 'c1',
          chauffeurId: 'cf1',
          nombrePlaces: 1,
          prixTotal: 5000,
          status: 'en_attente',
          createdAt: '',
          updatedAt: '',
        },
      ]);

      await useReservationsStore.getState().loadChauffeurReservations('cf1');
      expect(useReservationsStore.getState().chauffeurReservations).toHaveLength(1);
    });
  });
});
