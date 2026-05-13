import {
  applyVoyageFilters,
  countActiveVoyageFilters,
  parseVoyagePrice,
  DEFAULT_VOYAGE_FILTERS,
  type VoyageFilters,
} from '../voyagesFilters';
import type { Voyage } from '../../types';

function v(overrides: Partial<Voyage>): Voyage {
  return {
    id: 'id',
    type: 'Moto',
    from: 'Libreville',
    to: 'Port-Gentil',
    price: '5000 FCFA',
    icon: '🏍️',
    ...overrides,
  };
}

describe('parseVoyagePrice', () => {
  it('parses standard format', () => {
    expect(parseVoyagePrice('5000 FCFA')).toBe(5000);
  });

  it('parses with thousands separator', () => {
    expect(parseVoyagePrice('12 500 FCFA')).toBe(12500);
  });

  it('returns NaN for unparseable input', () => {
    expect(parseVoyagePrice('gratis')).toBeNaN();
  });
});

describe('applyVoyageFilters — type filter', () => {
  const list = [v({ id: '1', type: 'Moto' }), v({ id: '2', type: 'Voiture' })];

  it('keeps all when selectedType=All', () => {
    expect(applyVoyageFilters(list, DEFAULT_VOYAGE_FILTERS)).toHaveLength(2);
  });

  it('keeps only matching type', () => {
    expect(
      applyVoyageFilters(list, { ...DEFAULT_VOYAGE_FILTERS, selectedType: 'Moto' })
    ).toEqual([list[0]]);
  });
});

describe('applyVoyageFilters — city filter', () => {
  const list = [
    v({ id: '1', from: 'Libreville', to: 'Port-Gentil' }),
    v({ id: '2', from: 'Oyem', to: 'Libreville' }),
  ];

  it('matches from city case-insensitively (substring)', () => {
    expect(
      applyVoyageFilters(list, { ...DEFAULT_VOYAGE_FILTERS, fromCity: 'libre' })
    ).toEqual([list[0]]);
  });

  it('matches to city case-insensitively', () => {
    expect(
      applyVoyageFilters(list, { ...DEFAULT_VOYAGE_FILTERS, toCity: 'LIBRE' })
    ).toEqual([list[1]]);
  });

  it('combines from and to', () => {
    expect(
      applyVoyageFilters(list, {
        ...DEFAULT_VOYAGE_FILTERS,
        fromCity: 'oyem',
        toCity: 'libre',
      })
    ).toEqual([list[1]]);
  });
});

describe('applyVoyageFilters — priceMax', () => {
  const list = [
    v({ id: '1', price: '2000 FCFA' }),
    v({ id: '2', price: '5000 FCFA' }),
    v({ id: '3', price: '10000 FCFA' }),
  ];

  it('keeps all when priceMax=null', () => {
    expect(applyVoyageFilters(list, DEFAULT_VOYAGE_FILTERS)).toHaveLength(3);
  });

  it('filters above the threshold (inclusive)', () => {
    const result = applyVoyageFilters(list, {
      ...DEFAULT_VOYAGE_FILTERS,
      priceMax: 5000,
    });
    expect(result.map((x) => x.id)).toEqual(['1', '2']);
  });

  it('keeps malformed prices rather than silently dropping listings', () => {
    const messed = [...list, v({ id: '4', price: 'invalid' })];
    const result = applyVoyageFilters(messed, { ...DEFAULT_VOYAGE_FILTERS, priceMax: 3000 });
    expect(result.map((x) => x.id).sort()).toEqual(['1', '4']);
  });
});

describe('applyVoyageFilters — departureWindow', () => {
  // Build dates in local time to match the runtime's behaviour
  const at = (hour: number) => {
    const d = new Date();
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  };
  const list = [
    v({ id: 'morning', date: at(8) }),
    v({ id: 'noon', date: at(13) }),
    v({ id: 'evening', date: at(20) }),
    v({ id: 'night', date: at(3) }),
    v({ id: 'no-date', date: undefined }),
  ];

  it('matches morning 6h-12h', () => {
    const result = applyVoyageFilters(list, {
      ...DEFAULT_VOYAGE_FILTERS,
      departureWindow: 'morning',
    });
    expect(result.map((x) => x.id)).toEqual(['morning']);
  });

  it('matches night 0h-6h', () => {
    const result = applyVoyageFilters(list, {
      ...DEFAULT_VOYAGE_FILTERS,
      departureWindow: 'night',
    });
    expect(result.map((x) => x.id)).toEqual(['night']);
  });

  it('rejects entries with no date', () => {
    const result = applyVoyageFilters(list, {
      ...DEFAULT_VOYAGE_FILTERS,
      departureWindow: 'morning',
    });
    expect(result.find((x) => x.id === 'no-date')).toBeUndefined();
  });
});

describe('applyVoyageFilters — sorting', () => {
  const list = [
    v({ id: 'a', price: '7000 FCFA', chauffeurRating: 3.5, date: '2026-05-15T10:00:00Z' }),
    v({ id: 'b', price: '3000 FCFA', chauffeurRating: 4.8, date: '2026-05-15T08:00:00Z' }),
    v({ id: 'c', price: '5000 FCFA', chauffeurRating: 4.2, date: '2026-05-15T14:00:00Z' }),
  ];

  it('sort price_asc orders cheapest first', () => {
    const result = applyVoyageFilters(list, { ...DEFAULT_VOYAGE_FILTERS, sortBy: 'price_asc' });
    expect(result.map((x) => x.id)).toEqual(['b', 'c', 'a']);
  });

  it('sort price_desc orders most expensive first', () => {
    const result = applyVoyageFilters(list, { ...DEFAULT_VOYAGE_FILTERS, sortBy: 'price_desc' });
    expect(result.map((x) => x.id)).toEqual(['a', 'c', 'b']);
  });

  it('sort rating_desc orders best rated first', () => {
    const result = applyVoyageFilters(list, {
      ...DEFAULT_VOYAGE_FILTERS,
      sortBy: 'rating_desc',
    });
    expect(result.map((x) => x.id)).toEqual(['b', 'c', 'a']);
  });

  it('sort date_asc orders earliest first', () => {
    const result = applyVoyageFilters(list, { ...DEFAULT_VOYAGE_FILTERS, sortBy: 'date_asc' });
    expect(result.map((x) => x.id)).toEqual(['b', 'a', 'c']);
  });

  it('default sort preserves source order', () => {
    const result = applyVoyageFilters(list, DEFAULT_VOYAGE_FILTERS);
    expect(result.map((x) => x.id)).toEqual(['a', 'b', 'c']);
  });

  it('does not mutate the source array', () => {
    const before = [...list];
    applyVoyageFilters(list, { ...DEFAULT_VOYAGE_FILTERS, sortBy: 'price_asc' });
    expect(list).toEqual(before);
  });
});

describe('countActiveVoyageFilters', () => {
  it('returns 0 for defaults', () => {
    expect(countActiveVoyageFilters(DEFAULT_VOYAGE_FILTERS)).toBe(0);
  });

  it('ignores type and city filters (those are visible in the quick row)', () => {
    const f: VoyageFilters = {
      ...DEFAULT_VOYAGE_FILTERS,
      selectedType: 'Moto',
      fromCity: 'Libreville',
      toCity: 'Oyem',
    };
    expect(countActiveVoyageFilters(f)).toBe(0);
  });

  it('counts priceMax + window + sort independently', () => {
    expect(
      countActiveVoyageFilters({
        ...DEFAULT_VOYAGE_FILTERS,
        priceMax: 5000,
        departureWindow: 'morning',
        sortBy: 'price_asc',
      })
    ).toBe(3);
  });
});
