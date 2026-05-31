/**
 * Pre-flight validation for the booking flow. Each branch returns a friendly
 * French message identifying *which* piece is missing — replaces the
 * vague "Informations de réservation incomplètes" that left users guessing.
 */

export interface TrajetBookingPreconditions {
  supabaseProfileId: string | null;
  chauffeurProfileId: string;
  trajetId: string;
  availableSeats: number;
  requestedSeats: number;
}

export interface HebergementBookingPreconditions {
  supabaseProfileId: string | null;
  hebergeurProfileId: string;
  hebergementId: string;
  availableUnits: number;
  /** Max guests the listing accommodates (hebergements.capacite). */
  capacite: number;
  /** Guests the client picked for this stay. */
  requestedGuests: number;
}

export type BookingValidation =
  | { ok: true }
  | { ok: false; reason: BookingBlockReason; message: string };

export type BookingBlockReason =
  | 'profile_not_synced'
  | 'announcement_unavailable'
  | 'sold_out'
  | 'not_enough_seats'
  | 'over_capacity';

export function validateTrajetBooking(p: TrajetBookingPreconditions): BookingValidation {
  if (!p.supabaseProfileId) {
    return {
      ok: false,
      reason: 'profile_not_synced',
      message:
        "Ton profil n'est pas encore synchronisé avec la base. Reconnecte-toi puis réessaie.",
    };
  }
  if (!p.chauffeurProfileId || !p.trajetId) {
    return {
      ok: false,
      reason: 'announcement_unavailable',
      message:
        "Cette annonce semble indisponible — elle a peut-être été retirée. Reviens à la liste et choisis-en une autre.",
    };
  }
  if (p.availableSeats <= 0) {
    return {
      ok: false,
      reason: 'sold_out',
      message: 'Ce trajet est complet.',
    };
  }
  if (p.requestedSeats > p.availableSeats) {
    return {
      ok: false,
      reason: 'not_enough_seats',
      message: `Il reste seulement ${p.availableSeats} place${p.availableSeats > 1 ? 's' : ''} disponible${p.availableSeats > 1 ? 's' : ''}.`,
    };
  }
  return { ok: true };
}

export function validateHebergementBooking(p: HebergementBookingPreconditions): BookingValidation {
  if (!p.supabaseProfileId) {
    return {
      ok: false,
      reason: 'profile_not_synced',
      message:
        "Ton profil n'est pas encore synchronisé avec la base. Reconnecte-toi puis réessaie.",
    };
  }
  if (!p.hebergeurProfileId || !p.hebergementId) {
    return {
      ok: false,
      reason: 'announcement_unavailable',
      message:
        "Ce logement semble indisponible — il a peut-être été retiré. Reviens à la liste et choisis-en un autre.",
    };
  }
  if (p.availableUnits <= 0) {
    return {
      ok: false,
      reason: 'sold_out',
      message: 'Ce logement est complet.',
    };
  }
  if (p.requestedGuests < 1 || p.requestedGuests > p.capacite) {
    return {
      ok: false,
      reason: 'over_capacity',
      message: `Ce logement accueille jusqu'à ${p.capacite} voyageur${p.capacite > 1 ? 's' : ''}.`,
    };
  }
  return { ok: true };
}
