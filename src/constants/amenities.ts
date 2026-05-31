/**
 * Canonical list of hébergement amenities (services the hôte can offer).
 *
 * This is the SINGLE source of truth shared by the publish form (the
 * hébergeur toggles these) and the detail screen (the client sees exactly
 * the ones that were toggled — nothing more, nothing less). Reservations
 * store the selected `key`s; rendering maps each key back to its label +
 * icon here. An unknown/legacy key is simply skipped, so the client never
 * sees an amenity the hôte didn't actually pick.
 *
 * Set tuned for the Gabon context (backup generator, hot water, on-site
 * guarding are locally meaningful selling points).
 */

export interface Amenity {
  key: string;
  label: string;
  /** Ionicons glyph name. */
  icon: string;
}

export const HEBERGEMENT_AMENITIES: Amenity[] = [
  { key: 'wifi', label: 'Wi-Fi', icon: 'wifi' },
  { key: 'climatisation', label: 'Climatisation', icon: 'snow-outline' },
  { key: 'eau_chaude', label: 'Eau chaude', icon: 'thermometer-outline' },
  { key: 'groupe_electrogene', label: 'Groupe électrogène', icon: 'flash-outline' },
  { key: 'parking', label: 'Parking', icon: 'car-outline' },
  { key: 'petit_dejeuner', label: 'Petit-déjeuner', icon: 'cafe-outline' },
  { key: 'cuisine', label: 'Cuisine équipée', icon: 'restaurant-outline' },
  { key: 'television', label: 'Télévision', icon: 'tv-outline' },
  { key: 'machine_laver', label: 'Machine à laver', icon: 'shirt-outline' },
  { key: 'piscine', label: 'Piscine', icon: 'water-outline' },
  { key: 'gardiennage', label: 'Gardiennage', icon: 'shield-checkmark-outline' },
];

const AMENITY_BY_KEY: Record<string, Amenity> = Object.fromEntries(
  HEBERGEMENT_AMENITIES.map((a) => [a.key, a])
);

/** Returns the catalog amenity for a key, or undefined for an unknown key. */
export function getAmenity(key: string): Amenity | undefined {
  return AMENITY_BY_KEY[key];
}

/**
 * Maps stored keys to catalog amenities, preserving the canonical display
 * order and dropping any key not in the catalog. This is what guarantees
 * the client only ever sees amenities the hôte actually selected.
 */
export function resolveAmenities(keys: string[] | undefined | null): Amenity[] {
  if (!keys || keys.length === 0) return [];
  const set = new Set(keys);
  return HEBERGEMENT_AMENITIES.filter((a) => set.has(a.key));
}
