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
 * Nettoie et sanitise une entrée utilisateur
 */
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
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
