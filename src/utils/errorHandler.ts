interface ErrorResponse {
  message: string;
  displayMessage: string;
  code?: string;
}

export const handleError = (error: unknown, context?: string): ErrorResponse => {
  const message = error instanceof Error ? error.message : 'Unknown error';

  if (__DEV__) {
    console.error(`Error in ${context || 'app'}:`, message, error);
  }

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
    code: error instanceof Error ? (error as Error & { code?: string }).code : undefined,
  };
};

export const logError = (error: unknown, context?: string): void => {
  if (__DEV__) {
    console.error(`[${context || 'App'}]`, error);
  }
};

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
