// Pure formatters shared by the voyage-detail and hebergement-detail
// boarding-pass screens. Kept here (not co-located in each screen file)
// so they can be unit-tested without importing React Native modules.

import { COLORS } from '../constants';

/**
 * IATA-style 3-letter code for a city name.
 * Strips diacritics, removes non-letters, uppercases, takes first 3 chars.
 * Returns '---' if the name yields no letters.
 */
export function cityCode(name: string): string {
  return (
    (name || '')
      .normalize('NFD')
      // strip combining diacritical marks
      .replace(/[̀-ͯ]/g, '')
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .slice(0, 3) || '---'
  );
}

/** "HH:mm" — empty string when iso is missing or unparseable. */
export function formatTime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

/** "Mar 15 mar" style French short date — empty string on bad input. */
export function formatLongDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const months = [
    'jan', 'fév', 'mar', 'avr', 'mai', 'juin',
    'juil', 'août', 'sep', 'oct', 'nov', 'déc',
  ];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

/**
 * French-locale thousand-separated price.
 *
 * `toLocaleString('fr-FR')` uses NBSP (U+00A0) or NNBSP (U+202F) depending
 * on the JS runtime / ICU version, which made the output non-deterministic
 * across Node releases. We normalise all whitespace variants — plus any
 * stray comma fallback — to a regular space so consumers (and tests) can
 * rely on the exact characters.
 */
export function formatPriceFr(value: number): string {
  return value
    .toLocaleString('fr-FR')
    .replace(/[  ]/g, ' ')
    .replace(/,/g, ' ');
}

export type AvailabilityStyle = { color: string; label: string };

/** Voyage availability: places, with sold-out / scarcity messaging. */
export function getVoyageAvailability(count: number): AvailabilityStyle {
  if (count <= 0) return { color: COLORS.error, label: 'Complet' };
  if (count <= 2) return { color: COLORS.warning, label: `Plus que ${count} !` };
  return { color: COLORS.success, label: `${count} places` };
}

/** Hebergement availability: units, with abbreviated 'dispo.' label. */
export function getHebergementAvailability(count: number): AvailabilityStyle {
  if (count <= 0) return { color: COLORS.error, label: 'Complet' };
  if (count <= 2) return { color: COLORS.warning, label: `Plus que ${count} !` };
  return { color: COLORS.success, label: `${count} dispo.` };
}

/** Returns a new Date `n` days after `d` (does not mutate `d`). */
export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** Local calendar date as `YYYY-MM-DD` (no timezone shift, unlike toISOString). */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Stay window for an hébergement booking: check-in date + nights → the two
 * ISO calendar dates stored on the reservation. Nights is floored to >= 1
 * so check-out is always strictly after check-in.
 */
export function computeStay(
  checkIn: Date,
  nights: number
): { dateArrivee: string; dateDepart: string } {
  const n = Math.max(1, Math.floor(nights) || 1);
  return {
    dateArrivee: toISODate(checkIn),
    dateDepart: toISODate(addDays(checkIn, n)),
  };
}

/** "12 juin" style day+month — empty string on bad input. */
export function formatDayMonthFr(d: Date): string {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '';
  const months = [
    'jan', 'fév', 'mar', 'avr', 'mai', 'juin',
    'juil', 'août', 'sep', 'oct', 'nov', 'déc',
  ];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

/**
 * Hebergement images param: JSON-encoded string[] when sent from the
 * listing, or a single URL string from older callers.
 */
export function parseImagesParam(raw: unknown): string[] {
  if (typeof raw !== 'string' || !raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((u): u is string => typeof u === 'string' && u.length > 0);
    }
  } catch {
    if (raw.startsWith('http')) return [raw];
  }
  return [];
}
