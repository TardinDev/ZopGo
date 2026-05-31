/**
 * resolveAmenities is the coherence guard between what the hôte stored and
 * what the client sees: it maps stored keys to the catalog, DROPS unknown
 * keys, and renders in canonical order. These tests pin that behaviour so
 * a client never sees an amenity the hôte didn't actually declare.
 */
import {
  HEBERGEMENT_AMENITIES,
  getAmenity,
  resolveAmenities,
} from '../amenities';

describe('resolveAmenities', () => {
  it('returns an empty array for empty / null / undefined input', () => {
    expect(resolveAmenities([])).toEqual([]);
    expect(resolveAmenities(undefined)).toEqual([]);
    expect(resolveAmenities(null)).toEqual([]);
  });

  it('maps known keys to their catalog amenity', () => {
    const out = resolveAmenities(['wifi', 'parking']);
    expect(out.map((a) => a.key)).toEqual(['wifi', 'parking']);
    expect(out.every((a) => a.label && a.icon)).toBe(true);
  });

  it('drops keys that are not in the catalog', () => {
    const out = resolveAmenities(['wifi', 'jacuzzi_en_or', 'parking']);
    expect(out.map((a) => a.key)).toEqual(['wifi', 'parking']);
  });

  it('renders in canonical order regardless of input order', () => {
    // wifi comes before parking in the catalog; input is reversed.
    const out = resolveAmenities(['parking', 'wifi']);
    expect(out.map((a) => a.key)).toEqual(['wifi', 'parking']);
  });

  it('getAmenity returns the entry for a known key and undefined otherwise', () => {
    expect(getAmenity('wifi')?.label).toBe('Wi-Fi');
    expect(getAmenity('nope')).toBeUndefined();
  });

  it('every catalog amenity has a unique key', () => {
    const keys = HEBERGEMENT_AMENITIES.map((a) => a.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
