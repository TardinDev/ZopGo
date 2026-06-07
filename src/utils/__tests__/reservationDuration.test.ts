import { bookingDurationLabel } from '../reservationDuration';

describe('bookingDurationLabel', () => {
  it('uses the tarif period when period + units are provided', () => {
    expect(bookingDurationLabel(30, 'mois', 1)).toBe('1 mois');
    expect(bookingDurationLabel(14, 'semaine', 2)).toBe('2 semaines');
    expect(bookingDurationLabel(3, 'nuit', 3)).toBe('3 nuits');
  });

  it('falls back to a nights label when period/units are missing (legacy bookings)', () => {
    expect(bookingDurationLabel(5)).toBe('5 nuits');
    expect(bookingDurationLabel(1)).toBe('1 nuit');
  });

  it('falls back to nights when the period is invalid', () => {
    // @ts-expect-error testing a bad runtime value
    expect(bookingDurationLabel(7, 'annee', 1)).toBe('7 nuits');
  });
});
