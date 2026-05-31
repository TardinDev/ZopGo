import {
  validateTrajetBooking,
  validateHebergementBooking,
} from '../bookingValidation';

describe('validateTrajetBooking', () => {
  const base = {
    supabaseProfileId: 'client-uuid',
    chauffeurProfileId: 'driver-uuid',
    trajetId: 'trajet-uuid',
    availableSeats: 3,
    requestedSeats: 1,
  };

  it('returns ok=true when every precondition is met', () => {
    const result = validateTrajetBooking(base);
    expect(result.ok).toBe(true);
  });

  it('blocks with profile_not_synced when client has no Supabase profile', () => {
    const result = validateTrajetBooking({ ...base, supabaseProfileId: null });
    expect(result).toEqual({
      ok: false,
      reason: 'profile_not_synced',
      message:
        "Ton profil n'est pas encore synchronisé avec la base. Reconnecte-toi puis réessaie.",
    });
  });

  it('profile_not_synced takes precedence over other missing data', () => {
    const result = validateTrajetBooking({
      ...base,
      supabaseProfileId: null,
      chauffeurProfileId: '',
      trajetId: '',
      availableSeats: 0,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('profile_not_synced');
  });

  it('blocks with announcement_unavailable when chauffeurProfileId missing', () => {
    const result = validateTrajetBooking({ ...base, chauffeurProfileId: '' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('announcement_unavailable');
      expect(result.message).toMatch(/indisponible/i);
    }
  });

  it('blocks with announcement_unavailable when trajetId missing', () => {
    const result = validateTrajetBooking({ ...base, trajetId: '' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('announcement_unavailable');
  });

  it('blocks with sold_out when no seats available', () => {
    const result = validateTrajetBooking({ ...base, availableSeats: 0, requestedSeats: 1 });
    expect(result).toEqual({
      ok: false,
      reason: 'sold_out',
      message: 'Ce trajet est complet.',
    });
  });

  it('blocks with not_enough_seats when requesting more than available', () => {
    const result = validateTrajetBooking({ ...base, availableSeats: 2, requestedSeats: 5 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('not_enough_seats');
      expect(result.message).toContain('2');
    }
  });

  it('singular wording for 1 remaining seat', () => {
    const result = validateTrajetBooking({ ...base, availableSeats: 1, requestedSeats: 2 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe('Il reste seulement 1 place disponible.');
    }
  });

  it('plural wording for 2+ remaining seats', () => {
    const result = validateTrajetBooking({ ...base, availableSeats: 2, requestedSeats: 5 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe('Il reste seulement 2 places disponibles.');
    }
  });
});

describe('validateHebergementBooking', () => {
  const base = {
    supabaseProfileId: 'client-uuid',
    hebergeurProfileId: 'host-uuid',
    hebergementId: 'hebergement-uuid',
    availableUnits: 2,
    capacite: 4,
    requestedGuests: 2,
  };

  it('returns ok=true when every precondition is met', () => {
    const result = validateHebergementBooking(base);
    expect(result.ok).toBe(true);
  });

  it('blocks with over_capacity when guests exceed the listing capacity', () => {
    const result = validateHebergementBooking({ ...base, requestedGuests: 5 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('over_capacity');
      expect(result.message).toMatch(/4 voyageurs/);
    }
  });

  it('allows booking exactly at capacity', () => {
    const result = validateHebergementBooking({ ...base, requestedGuests: 4 });
    expect(result.ok).toBe(true);
  });

  it('blocks with over_capacity when guests is below 1', () => {
    const result = validateHebergementBooking({ ...base, requestedGuests: 0 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('over_capacity');
  });

  it('blocks with profile_not_synced when client has no Supabase profile', () => {
    const result = validateHebergementBooking({ ...base, supabaseProfileId: null });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('profile_not_synced');
      expect(result.message).toMatch(/Reconnecte-toi/);
    }
  });

  it('blocks with announcement_unavailable when hebergeurProfileId missing', () => {
    const result = validateHebergementBooking({ ...base, hebergeurProfileId: '' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('announcement_unavailable');
  });

  it('blocks with announcement_unavailable when hebergementId missing', () => {
    const result = validateHebergementBooking({ ...base, hebergementId: '' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('announcement_unavailable');
  });

  it('blocks with sold_out when no units available', () => {
    const result = validateHebergementBooking({ ...base, availableUnits: 0 });
    expect(result).toEqual({
      ok: false,
      reason: 'sold_out',
      message: 'Ce logement est complet.',
    });
  });

  it('does not surface technical reason codes in the user-facing message', () => {
    const cases = [
      { ...base, supabaseProfileId: null },
      { ...base, hebergeurProfileId: '' },
      { ...base, availableUnits: 0 },
    ];
    for (const c of cases) {
      const r = validateHebergementBooking(c);
      if (!r.ok) {
        expect(r.message).not.toContain('profile_not_synced');
        expect(r.message).not.toContain('announcement_unavailable');
        expect(r.message).not.toContain('sold_out');
      }
    }
  });
});
