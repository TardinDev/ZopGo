import { create } from 'zustand';
import { Trajet, VehicleType } from '../types';
import {
  fetchTrajets as fetchSupabaseTrajets,
  insertTrajet,
  deleteTrajet as deleteSupabaseTrajet,
  markTrajetEffectue as markSupabaseTrajetEffectue,
} from '../lib/supabaseTrajets';
import { fetchReservationsByTrajetId } from '../lib/supabaseReservations';
import {
  sendPushIfAllowed,
  sendPushBroadcast,
} from '../lib/pushNotifications';

interface TrajetFormData {
  villeDepart: string;
  villeArrivee: string;
  prix: string;
  vehicule: VehicleType;
  date: string;
  placesDisponibles: string;
  marque: string;
  modele: string;
  couleur: string;
}

const initialFormData: TrajetFormData = {
  villeDepart: '',
  villeArrivee: '',
  prix: '',
  vehicule: 'voiture',
  date: '',
  placesDisponibles: '1',
  marque: '',
  modele: '',
  couleur: '',
};

interface TrajetsState {
  trajets: Trajet[];
  formData: TrajetFormData;
  isLoading: boolean;

  addTrajet: (chauffeurId: string, supabaseProfileId?: string) => Promise<void>;
  removeTrajet: (id: string) => Promise<void>;
  markEffectue: (id: string) => Promise<void>;
  updateForm: (field: keyof TrajetFormData, value: string) => void;
  resetForm: () => void;
  loadTrajets: (supabaseProfileId: string) => Promise<void>;
}

export const useTrajetsStore = create<TrajetsState>((set, get) => ({
  trajets: [],
  formData: { ...initialFormData },
  isLoading: false,

  addTrajet: async (chauffeurId, supabaseProfileId) => {
    const { formData, trajets } = get();

    const localTrajet: Trajet = {
      id: Date.now().toString(),
      chauffeurId,
      villeDepart: formData.villeDepart,
      villeArrivee: formData.villeArrivee,
      prix: parseInt(formData.prix) || 0,
      vehicule: formData.vehicule,
      date: formData.date || new Date().toISOString(),
      placesDisponibles: parseInt(formData.placesDisponibles) || 1,
      status: 'en_attente',
      createdAt: new Date().toISOString(),
      marque: formData.marque || undefined,
      modele: formData.modele || undefined,
      couleur: formData.couleur || undefined,
    };
    set({ trajets: [localTrajet, ...trajets], formData: { ...initialFormData } });

    if (supabaseProfileId) {
      try {
        const result = await insertTrajet({
          chauffeur_id: supabaseProfileId,
          ville_depart: formData.villeDepart,
          ville_arrivee: formData.villeArrivee,
          prix: parseInt(formData.prix) || 0,
          vehicule: formData.vehicule,
          date: formData.date || undefined,
          places_disponibles: parseInt(formData.placesDisponibles) || 1,
          marque: formData.marque || undefined,
          modele: formData.modele || undefined,
          couleur: formData.couleur || undefined,
        });

        if (result) {
          set((state) => ({
            trajets: state.trajets.map((t) =>
              t.id === localTrajet.id ? { ...t, id: result.id } : t
            ),
          }));

          // Broadcast to all clients (respects notification_preferences on the
          // Edge Function side). Fire-and-forget.
          void sendPushBroadcast({
            category: 'trajets',
            recipientRole: 'client',
            title: 'Nouveau trajet disponible',
            message: `${formData.villeDepart} → ${formData.villeArrivee} — ${formData.prix} FCFA`,
            data: {
              trajetId: result.id,
              type: 'new_trajet',
              villeDepart: formData.villeDepart,
              villeArrivee: formData.villeArrivee,
            },
          });
        }
      } catch (err) {
        set((state) => ({ trajets: state.trajets.filter((t) => t.id !== localTrajet.id) }));
        if (__DEV__) console.error('addTrajet error:', err);
      }
    }
  },

  removeTrajet: async (id) => {
    const previous = get().trajets;
    const trajet = previous.find((t) => t.id === id);

    // IMPORTANT: fetch reservations BEFORE the delete — the foreign key
    // cascades, so after deleteTrajet the reservations rows are gone.
    let clientIds: string[] = [];
    try {
      const reservations = await fetchReservationsByTrajetId(id);
      clientIds = Array.from(new Set(reservations.map((r) => r.clientId)));
    } catch (err) {
      if (__DEV__) console.error('fetchReservationsByTrajetId error:', err);
    }

    set({ trajets: previous.filter((t) => t.id !== id) });
    try {
      await deleteSupabaseTrajet(id);

      // Notify affected clients. Small N (< 20 typically), loop is fine.
      const routeLabel =
        trajet?.villeDepart && trajet?.villeArrivee
          ? `${trajet.villeDepart} → ${trajet.villeArrivee}`
          : '';
      clientIds.forEach((clientId) => {
        void sendPushIfAllowed({
          recipientProfileId: clientId,
          category: 'trajets',
          type: 'trajet_annule',
          title: 'Trajet annulé',
          body: routeLabel
            ? `Le chauffeur a annulé le trajet ${routeLabel}`
            : 'Le chauffeur a annulé un trajet que vous aviez réservé',
          icon: 'close-circle',
          iconColor: '#EF4444',
          iconBg: '#FEE2E2',
          data: {
            trajetId: id,
            type: 'trajet_annule',
            ...(trajet?.villeDepart && { villeDepart: trajet.villeDepart }),
            ...(trajet?.villeArrivee && { villeArrivee: trajet.villeArrivee }),
          },
        });
      });
    } catch (err) {
      set({ trajets: previous });
      if (__DEV__) console.error('removeTrajet error:', err);
    }
  },

  markEffectue: async (id) => {
    const previous = get().trajets;
    const trajet = previous.find((t) => t.id === id);
    set({
      trajets: previous.map((t) =>
        t.id === id ? { ...t, status: 'effectue' as const } : t
      ),
    });
    try {
      await markSupabaseTrajetEffectue(id);

      // Notify accepted passengers: "trip completed, leave a review"
      try {
        const reservations = await fetchReservationsByTrajetId(id, ['acceptee']);
        const clientIds = Array.from(new Set(reservations.map((r) => r.clientId)));
        const routeLabel =
          trajet?.villeDepart && trajet?.villeArrivee
            ? `${trajet.villeDepart} → ${trajet.villeArrivee}`
            : '';
        clientIds.forEach((clientId) => {
          void sendPushIfAllowed({
            recipientProfileId: clientId,
            category: 'trajets',
            type: 'trajet_termine',
            title: 'Trajet terminé',
            body: routeLabel
              ? `${routeLabel} — Laissez un avis à votre chauffeur`
              : 'Laissez un avis à votre chauffeur',
            icon: 'checkmark-done-circle',
            iconColor: '#10B981',
            iconBg: '#D1FAE5',
            data: {
              trajetId: id,
              type: 'trajet_termine',
              ...(trajet?.villeDepart && { villeDepart: trajet.villeDepart }),
              ...(trajet?.villeArrivee && { villeArrivee: trajet.villeArrivee }),
            },
          });
        });
      } catch (pushErr) {
        if (__DEV__) console.error('markEffectue push error:', pushErr);
      }
    } catch (err) {
      set({ trajets: previous });
      if (__DEV__) console.error('markEffectue error:', err);
    }
  },

  updateForm: (field, value) => {
    set({ formData: { ...get().formData, [field]: value } });
  },

  resetForm: () => {
    set({ formData: { ...initialFormData } });
  },

  loadTrajets: async (supabaseProfileId) => {
    set({ isLoading: true });
    try {
      const data = await fetchSupabaseTrajets(supabaseProfileId);
      const trajets: Trajet[] = data.map((t) => ({
        id: t.id,
        chauffeurId: t.chauffeur_id,
        villeDepart: t.ville_depart,
        villeArrivee: t.ville_arrivee,
        prix: t.prix,
        vehicule: t.vehicule as VehicleType,
        date: t.date || '',
        placesDisponibles: t.places_disponibles,
        status: t.status as 'en_attente' | 'effectue',
        createdAt: t.created_at,
        marque: t.marque || undefined,
        modele: t.modele || undefined,
        couleur: t.couleur || undefined,
      }));
      set({ trajets });
    } catch (err) {
      if (__DEV__) console.error('loadTrajets error:', err);
    } finally {
      set({ isLoading: false });
    }
  },
}));
