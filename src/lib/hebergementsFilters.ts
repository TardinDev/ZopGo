import type { Hebergement } from '../types';

export type HebergementSort = 'default' | 'price_asc' | 'price_desc' | 'rating_desc';

export interface HebergementFilters {
  selectedType: string;
  searchLocation: string;
  priceMax: number | null;
  minCapacity: number | null;
  sortBy: HebergementSort;
}

export const DEFAULT_HEBERGEMENT_FILTERS: HebergementFilters = {
  selectedType: 'All',
  searchLocation: '',
  priceMax: null,
  minCapacity: null,
  sortBy: 'default',
};

export function applyHebergementFilters(
  listings: Hebergement[],
  f: HebergementFilters
): Hebergement[] {
  const filtered = listings
    .filter((h) => f.selectedType === 'All' || h.type === f.selectedType)
    .filter((h) => {
      if (!f.searchLocation.trim()) return true;
      return (h.location || '').toLowerCase().includes(f.searchLocation.toLowerCase());
    })
    .filter((h) => (f.priceMax == null ? true : h.prixParNuit <= f.priceMax))
    .filter((h) =>
      f.minCapacity == null ? true : (h.capacite ?? 0) >= f.minCapacity
    );

  if (f.sortBy === 'default') return filtered;

  const copy = [...filtered];
  copy.sort((a, b) => {
    switch (f.sortBy) {
      case 'price_asc':
        return a.prixParNuit - b.prixParNuit;
      case 'price_desc':
        return b.prixParNuit - a.prixParNuit;
      case 'rating_desc':
        return (b.hebergeurRating ?? b.rating ?? 0) - (a.hebergeurRating ?? a.rating ?? 0);
      default:
        return 0;
    }
  });
  return copy;
}

// Counts only the filters surfaced through the modal (price/capacity/sort),
// not the quick-filter row (selectedType/searchLocation), so the badge on the
// "Filtres" button doesn't double-count controls the user can already see.
export function countActiveHebergementFilters(f: HebergementFilters): number {
  let n = 0;
  if (f.priceMax != null) n++;
  if (f.minCapacity != null) n++;
  if (f.sortBy !== 'default') n++;
  return n;
}
