import { isTarifPeriode, uniteLabel, type TarifPeriode } from './tarifPeriode';

// Human label for a hébergement booking's duration. When the client picked a
// period (semaine/mois) we want "2 semaines" / "1 mois" — not the raw night
// count (14 / 30) that would confuse the hôte. Falls back to a nights label
// for legacy bookings that don't carry the period.
export function bookingDurationLabel(
  nombreNuits: number,
  periodeTarif?: TarifPeriode,
  nombreUnites?: number
): string {
  if (isTarifPeriode(periodeTarif) && typeof nombreUnites === 'number' && nombreUnites > 0) {
    return uniteLabel(periodeTarif, nombreUnites);
  }
  return uniteLabel('nuit', nombreNuits);
}
