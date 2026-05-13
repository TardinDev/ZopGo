import type { Voyage } from '../types';

export type DepartureWindow = 'morning' | 'afternoon' | 'evening' | 'night';
export type VoyageSort = 'default' | 'price_asc' | 'price_desc' | 'rating_desc' | 'date_asc';

export interface VoyageFilters {
  selectedType: string;
  fromCity: string;
  toCity: string;
  priceMax: number | null;
  departureWindow: DepartureWindow | null;
  sortBy: VoyageSort;
}

export const DEFAULT_VOYAGE_FILTERS: VoyageFilters = {
  selectedType: 'All',
  fromCity: '',
  toCity: '',
  priceMax: null,
  departureWindow: null,
  sortBy: 'default',
};

const WINDOW_RANGES: Record<DepartureWindow, [number, number]> = {
  morning: [6, 12],
  afternoon: [12, 18],
  evening: [18, 24],
  night: [0, 6],
};

export function parseVoyagePrice(price: string): number {
  // Format: "5000 FCFA". A NaN result (malformed string) is treated as Infinity
  // by callers so the price filter never silently drops legitimate listings.
  const digits = price.replace(/[^\d]/g, '');
  return digits ? parseInt(digits, 10) : NaN;
}

function inWindow(date: string | undefined, w: DepartureWindow): boolean {
  if (!date) return false;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return false;
  const hour = d.getHours();
  const [start, end] = WINDOW_RANGES[w];
  return hour >= start && hour < end;
}

export function applyVoyageFilters(voyages: Voyage[], f: VoyageFilters): Voyage[] {
  const filtered = voyages
    .filter((v) => f.selectedType === 'All' || v.type === f.selectedType)
    .filter((v) => {
      const matchFrom = !f.fromCity || v.from.toLowerCase().includes(f.fromCity.toLowerCase());
      const matchTo = !f.toCity || v.to.toLowerCase().includes(f.toCity.toLowerCase());
      return matchFrom && matchTo;
    })
    .filter((v) => {
      if (f.priceMax == null) return true;
      const n = parseVoyagePrice(v.price);
      // Unparseable → don't filter out (avoid hiding the listing because of
      // an unexpected format).
      return Number.isNaN(n) || n <= f.priceMax;
    })
    .filter((v) => (f.departureWindow ? inWindow(v.date, f.departureWindow) : true));

  if (f.sortBy === 'default') return filtered;

  const copy = [...filtered];
  copy.sort((a, b) => {
    switch (f.sortBy) {
      case 'price_asc':
        return (parseVoyagePrice(a.price) || Infinity) - (parseVoyagePrice(b.price) || Infinity);
      case 'price_desc':
        return (parseVoyagePrice(b.price) || 0) - (parseVoyagePrice(a.price) || 0);
      case 'rating_desc':
        return (b.chauffeurRating ?? 0) - (a.chauffeurRating ?? 0);
      case 'date_asc': {
        const ta = a.date ? new Date(a.date).getTime() : Infinity;
        const tb = b.date ? new Date(b.date).getTime() : Infinity;
        return ta - tb;
      }
      default:
        return 0;
    }
  });
  return copy;
}

// Counts only the filters surfaced through the modal (price/time/sort), not
// the quick-filter row (selectedType/fromCity/toCity), so the badge on the
// "Filtres" button doesn't double-count controls the user can already see.
export function countActiveVoyageFilters(f: VoyageFilters): number {
  let n = 0;
  if (f.priceMax != null) n++;
  if (f.departureWindow != null) n++;
  if (f.sortBy !== 'default') n++;
  return n;
}
