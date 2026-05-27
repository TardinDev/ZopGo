/**
 * Fonctions de validation des entrées utilisateur
 */

/**
 * Valide une adresse/localisation
 */
export const validateLocation = (location: string): boolean => {
  if (!location || location.trim().length < 2) {
    return false;
  }
  if (location.length > 100) {
    return false;
  }
  return true;
};

/**
 * Strips XSS-style payloads from a free-text field. Supabase uses
 * parameterized queries everywhere — SQL keyword filtering would only
 * mutilate legitimate French inputs ("Auberge SELECT à Akanda" became
 * "Auberge  à Akanda") without adding any real protection. Kept the
 * HTML / JS protocol / event-handler scrubs that DO matter when these
 * strings end up rendered in WebViews or admin dashboards.
 */
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/[<>&"']/g, '') // Remove characters that break HTML/attr context
    .replace(/javascript:/gi, '') // JS protocol
    .replace(/on\w+\s*=/gi, '') // Event handlers (onclick=, etc.)
    .trim();
};

export const validateName = (name: string): boolean => {
  if (!name || name.trim().length < 2 || name.trim().length > 50) return false;
  return /^[a-zA-ZÀ-ÿ\s'-]+$/.test(name.trim());
};

export const validateCity = (city: string): boolean => {
  if (!city || city.trim().length < 2 || city.trim().length > 50) return false;
  return /^[a-zA-ZÀ-ÿ\s'-]+$/.test(city.trim());
};

export const validatePrice = (price: number): boolean => {
  return typeof price === 'number' && !isNaN(price) && price > 0 && price <= 1_000_000;
};

export const validatePlaces = (n: number): boolean => {
  return Number.isInteger(n) && n >= 1 && n <= 100;
};

// Plate format isn't standardized across the region (Gabon, Cameroun, Congo all
// differ — and visitors transit with foreign plates), so we don't lock to a
// single regex. Require a non-empty alphanumeric string of plausible length
// with at least one digit and one letter — strict enough to reject obvious
// junk ("xxx", "1234"), loose enough not to reject valid foreign formats.
export const validateImmatriculation = (plate: string | undefined | null): boolean => {
  if (!plate) return false;
  const trimmed = plate.trim().toUpperCase();
  if (trimmed.length < 4 || trimmed.length > 15) return false;
  if (!/^[A-Z0-9\s-]+$/.test(trimmed)) return false;
  return /[A-Z]/.test(trimmed) && /[0-9]/.test(trimmed);
};

/**
 * Valide un email
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valide un numéro de téléphone (format Gabon)
 */
export const validatePhone = (phone: string): boolean => {
  // Format: +241 XX XX XX XX ou 0X XX XX XX
  const phoneRegex = /^(\+241|0)[0-9]{1}\s?[0-9]{2}\s?[0-9]{2}\s?[0-9]{2}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Valide un montant
 */
export const validateAmount = (amount: string | number): boolean => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(num) && num > 0;
};

/**
 * Formate un numéro de téléphone
 */
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('241')) {
    return `+241 ${cleaned.slice(3, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`;
  }
  return phone;
};
