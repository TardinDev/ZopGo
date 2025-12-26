/**
 * Gestionnaire centralisé d'erreurs
 */

interface ErrorResponse {
  message: string;
  displayMessage: string;
  code?: string;
}

/**
 * Gère une erreur et retourne un message utilisateur friendly
 */
export const handleError = (error: unknown, context?: string): ErrorResponse => {
  const message = error instanceof Error ? error.message : 'Unknown error';

  // Log l'erreur en développement
  if (__DEV__) {
    console.error(`Error in ${context || 'app'}:`, message, error);
  }

  // En production, envoyer à un service de tracking
  // TODO: Intégrer Sentry ou autre service
  // if (!__DEV__) {
  //   Sentry.captureException(error, { extra: { context } });
  // }

  // Messages utilisateur friendly selon le type d'erreur
  let displayMessage = 'Une erreur est survenue. Veuillez réessayer.';

  if (message.includes('network') || message.includes('fetch')) {
    displayMessage = 'Problème de connexion. Vérifiez votre connexion internet.';
  } else if (message.includes('timeout')) {
    displayMessage = 'La requête a pris trop de temps. Veuillez réessayer.';
  } else if (message.includes('not found')) {
    displayMessage = 'Ressource non trouvée.';
  } else if (message.includes('unauthorized') || message.includes('401')) {
    displayMessage = 'Session expirée. Veuillez vous reconnecter.';
  } else if (message.includes('forbidden') || message.includes('403')) {
    displayMessage = "Vous n'avez pas les permissions nécessaires.";
  }

  return {
    message,
    displayMessage,
    code: error instanceof Error ? (error as any).code : undefined,
  };
};

/**
 * Log une erreur sans la traiter
 */
export const logError = (error: unknown, context?: string): void => {
  if (__DEV__) {
    console.error(`[${context || 'App'}]`, error);
  }
  // TODO: Log to tracking service
};

/**
 * Vérifie si c'est une erreur réseau
 */
export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return (
      error.message.includes('network') ||
      error.message.includes('fetch') ||
      error.message.includes('timeout')
    );
  }
  return false;
};
