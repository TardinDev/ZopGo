import { useReservationsStore } from '../reservationsStore';
import {
  insertReservation,
  fetchReservationsForChauffeur,
  fetchReservationsForClient,
  acceptReservation as acceptApi,
  refuseReservation as refuseApi,
} from '../../lib/supabaseReservations';
import { updateTrajetPlaces } from '../../lib/supabaseTrajets';
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
    it('creates reservation, updates places, and notifies chauffeur', async () => {
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
      (updateTrajetPlaces as jest.Mock).mockResolvedValue(true);

      const result = await useReservationsStore.getState().bookTrajet({
        trajetId: 't1',
        clientId: 'c1',
        chauffeurId: 'cf1',
        nombrePlaces: 2,
        prixTotal: 10000,
        clientName: 'Alice',
        remainingPlaces: 4,
      });

      expect(result).not.toBeNull();
      expect(insertReservation).toHaveBeenCalled();
      expect(updateTrajetPlaces).toHaveBeenCalledWith('t1', 2);
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
        remainingPlaces: 2,
      });

      expect(result).toBeNull();
      expect(updateTrajetPlaces).not.toHaveBeenCalled();
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
        remainingPlaces: 2,
      });

      expect(sendPushIfAllowed).toHaveBeenCalled();
    });
  });

  describe('acceptReservation', () => {
    it('accepts, notifies client, and updates local state', async () => {
      (acceptApi as jest.Mock).mockResolvedValue(true);

      useReservationsStore.setState({
        chauffeurReservations: [
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
      expect(sendPushIfAllowed).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientProfileId: 'c1',
          category: 'trajets',
          type: 'reservation_acceptee',
        })
      );
      expect(useReservationsStore.getState().chauffeurReservations[0].status).toBe('acceptee');
    });

    it('returns false when API fails', async () => {
      (acceptApi as jest.Mock).mockResolvedValue(false);

      const ok = await useReservationsStore.getState().acceptReservation({
        reservationId: 'res-1',
        clientId: 'c1',
        chauffeurName: 'Bob',
        chauffeurId: 'cf1',
      });

      expect(ok).toBe(false);
      expect(sendPushIfAllowed).not.toHaveBeenCalled();
    });
  });

  describe('refuseReservation', () => {
    it('refuses, restores places, and notifies client', async () => {
      (refuseApi as jest.Mock).mockResolvedValue(true);
      (updateTrajetPlaces as jest.Mock).mockResolvedValue(true);

      const ok = await useReservationsStore.getState().refuseReservation({
        reservationId: 'res-1',
        clientId: 'c1',
        chauffeurId: 'cf1',
        trajetId: 't1',
        nombrePlaces: 2,
        currentPlaces: 1,
      });

      expect(ok).toBe(true);
      expect(updateTrajetPlaces).toHaveBeenCalledWith('t1', 3);
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
        trajetId: 't1',
        nombrePlaces: 1,
        currentPlaces: 2,
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
