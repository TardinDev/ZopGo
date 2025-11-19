/**
 * Constantes de timeouts et délais
 * Tous les temps en millisecondes
 */

export const TIMEOUTS = {
  // Délais d'acceptation
  DELIVERY_ACCEPTANCE: 300000, // 5 minutes pour l'acceptation d'une livraison
  DEMO_ACCEPTANCE: 4000, // 4 secondes pour la démo d'acceptation

  // Timeouts API
  API_REQUEST: 30000, // 30 secondes pour les requêtes API
  API_SHORT: 10000, // 10 secondes pour les requêtes courtes

  // Debounce
  SEARCH_DEBOUNCE: 300, // 300ms de debounce pour la recherche
  INPUT_DEBOUNCE: 500, // 500ms de debounce pour les inputs

  // Animations
  ANIMATION_SHORT: 150,
  ANIMATION_MEDIUM: 300,
  ANIMATION_LONG: 500,

  // Toast/Snackbar
  TOAST_DURATION: 3000, // 3 secondes pour les toasts
  ERROR_DURATION: 5000, // 5 secondes pour les erreurs

  // Retry
  RETRY_DELAY: 1000, // 1 seconde avant de retry
  MAX_RETRIES: 3,
} as const;

// Conversion de minutes en millisecondes
export const minutesToMs = (minutes: number): number => minutes * 60 * 1000;

// Conversion de secondes en millisecondes
export const secondsToMs = (seconds: number): number => seconds * 1000;
