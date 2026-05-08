export interface ClerkError {
  errors?: { code?: string; longMessage?: string; message?: string }[];
}

/**
 * Maps Clerk error codes to friendly French messages so users don't see
 * raw codes like "form_password_incorrect" in the auth banner.
 */
export function friendlyAuthError(err: ClerkError | undefined): string {
  const first = err?.errors?.[0];
  switch (first?.code) {
    case 'form_password_incorrect':
      return "Hmm, ce n'est pas le bon mot de passe. Réessaie.";
    case 'form_identifier_not_found':
      return "On ne te reconnaît pas... Vérifie ton email.";
    case 'form_identifier_exists':
      return "Cet email a déjà un compte. Connecte-toi à la place.";
    case 'session_exists':
      return "Tu es déjà connecté ailleurs.";
    case 'form_password_pwned':
      return "Ce mot de passe a fuité ailleurs. Choisis-en un autre, plus sûr.";
    case 'form_password_length_too_short':
      return "Mot de passe trop court — au moins 8 caractères.";
    case 'verification_failed':
    case 'form_code_incorrect':
      return "Le code est incorrect. Vérifie l'email et réessaie.";
    case 'too_many_requests':
      return "Beaucoup de tentatives... Attends une minute avant de réessayer.";
    default:
      return first?.longMessage || first?.message || "Oups, une erreur est survenue.";
  }
}
