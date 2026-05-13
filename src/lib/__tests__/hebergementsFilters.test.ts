import {
  applyHebergementFilters,
  countActiveHebergementFilters,
  DEFAULT_HEBERGEMENT_FILTERS,
  type HebergementFilters,
} from '../hebergementsFilters';
import type { Hebergement } from '../../types';

function h(overrides: Partial<Hebergement>): Hebergement {
  return {
    id: 1,
    supabaseId: 'sb-1',
    type: 'Hôtel',
    name: 'Le Lambaréné',
    location: 'Libreville',
    price: '25000 FCFA/nuit',
    prixParNuit: 25000,
    rating: 4.0,
    icon: '🏨',
    ...overrides,
  };
}

describe('applyHebergementFilters — type & location', () => {
  const list = [
    h({ id: 1, type: 'Hôtel', location: 'Libreville' }),
    h({ id: 2, type: 'Auberge', location: 'Oyem' }),
  ];

  it('keeps all by default', () => {
    expect(applyHebergementFilters(list, DEFAULT_HEBERGEMENT_FILTERS)).toHaveLength(2);
  });

  it('filters by type', () => {
    expect(
      applyHebergementFilters(list, {
        ...DEFAULT_HEBERGEMENT_FILTERS,
        selectedType: 'Auberge',
      })
    ).toEqual([list[1]]);
  });

  it('filters by location substring (case-insensitive)', () => {
    expect(
      applyHebergementFilters(list, {
        ...DEFAULT_HEBERGEMENT_FILTERS,
        searchLocation: 'OYEM',
      })
    ).toEqual([list[1]]);
  });
});

describe('applyHebergementFilters — priceMax', () => {
  const list = [
    h({ id: 1, prixParNuit: 10000 }),
    h({ id: 2, prixParNuit: 25000 }),
    h({ id: 3, prixParNuit: 50000 }),
  ];

  it('filters above threshold (inclusive)', () => {
    const result = applyHebergementFilters(list, {
      ...DEFAULT_HEBERGEMENT_FILTERS,
      priceMax: 25000,
    });
    expect(result.map((x) => x.id)).toEqual([1, 2]);
  });
});

describe('applyHebergementFilters — minCapacity', () => {
  const list = [
    h({ id: 1, capacite: 1 }),
    h({ id: 2, capacite: 4 }),
    h({ id: 3, capacite: undefined }),
  ];

  it('rejects below threshold and listings with no capacity', () => {
    const result = applyHebergementFilters(list, {
      ...DEFAULT_HEBERGEMENT_FILTERS,
      minCapacity: 2,
    });
    expect(result.map((x) => x.id)).toEqual([2]);
  });

  it('keeps all when minCapacity=null', () => {
    expect(applyHebergementFilters(list, DEFAULT_HEBERGEMENT_FILTERS)).toHaveLength(3);
  });
});

describe('applyHebergementFilters — sorting', () => {
  const list = [
    h({ id: 1, prixParNuit: 30000, hebergeurRating: 3.8 }),
    h({ id: 2, prixParNuit: 15000, hebergeurRating: 4.6 }),
    h({ id: 3, prixParNuit: 22000, hebergeurRating: 4.2 }),
  ];

  it('sorts price_asc', () => {
    const result = applyHebergementFilters(list, {
      ...DEFAULT_HEBERGEMENT_FILTERS,
      sortBy: 'price_asc',
    });
    expect(result.map((x) => x.id)).toEqual([2, 3, 1]);
  });

  it('sorts price_desc', () => {
    const result = applyHebergementFilters(list, {
      ...DEFAULT_HEBERGEMENT_FILTERS,
      sortBy: 'price_desc',
    });
    expect(result.map((x) => x.id)).toEqual([1, 3, 2]);
  });

  it('sorts rating_desc using hebergeurRating with fallback to rating', () => {
    const mixed = [
      h({ id: 1, hebergeurRating: undefined, rating: 4.9 }),
      h({ id: 2, hebergeurRating: 3.0, rating: 4.0 }),
    ];
    const result = applyHebergementFilters(mixed, {
      ...DEFAULT_HEBERGEMENT_FILTERS,
      sortBy: 'rating_desc',
    });
    expect(result.map((x) => x.id)).toEqual([1, 2]);
  });

  it('does not mutate the input array', () => {
    const before = [...list];
    applyHebergementFilters(list, { ...DEFAULT_HEBERGEMENT_FILTERS, sortBy: 'price_desc' });
    expect(list).toEqual(before);
  });
});

describe('countActiveHebergementFilters', () => {
  it('returns 0 for defaults', () => {
    expect(countActiveHebergementFilters(DEFAULT_HEBERGEMENT_FILTERS)).toBe(0);
  });

  it('ignores type and location (already visible in quick row)', () => {
    const f: HebergementFilters = {
      ...DEFAULT_HEBERGEMENT_FILTERS,
      selectedType: 'Hôtel',
      searchLocation: 'Libreville',
    };
    expect(countActiveHebergementFilters(f)).toBe(0);
  });

  it('counts price + capacity + sort independently', () => {
    expect(
      countActiveHebergementFilters({
        ...DEFAULT_HEBERGEMENT_FILTERS,
        priceMax: 30000,
        minCapacity: 2,
        sortBy: 'price_asc',
      })
    ).toBe(3);
  });
});
