import { friendlyAuthError } from '../clerkErrors';

describe('friendlyAuthError', () => {
  it('maps form_password_incorrect to a warm "wrong password" message', () => {
    expect(friendlyAuthError({ errors: [{ code: 'form_password_incorrect' }] })).toBe(
      "Hmm, ce n'est pas le bon mot de passe. Réessaie."
    );
  });

  it('maps form_identifier_not_found to a warm "unknown account" message', () => {
    expect(friendlyAuthError({ errors: [{ code: 'form_identifier_not_found' }] })).toBe(
      "On ne te reconnaît pas... Vérifie ton email."
    );
  });

  it('maps form_identifier_exists to a sign-in suggestion', () => {
    expect(friendlyAuthError({ errors: [{ code: 'form_identifier_exists' }] })).toBe(
      "Cet email a déjà un compte. Connecte-toi à la place."
    );
  });

  it('maps form_password_pwned with a security-aware message', () => {
    expect(friendlyAuthError({ errors: [{ code: 'form_password_pwned' }] })).toBe(
      "Ce mot de passe a fuité ailleurs. Choisis-en un autre, plus sûr."
    );
  });

  it('maps form_password_length_too_short with concrete minimum', () => {
    expect(friendlyAuthError({ errors: [{ code: 'form_password_length_too_short' }] })).toBe(
      "Mot de passe trop court — au moins 8 caractères."
    );
  });

  it('maps verification_failed and form_code_incorrect to the same message', () => {
    expect(friendlyAuthError({ errors: [{ code: 'verification_failed' }] })).toBe(
      "Le code est incorrect. Vérifie l'email et réessaie."
    );
    expect(friendlyAuthError({ errors: [{ code: 'form_code_incorrect' }] })).toBe(
      "Le code est incorrect. Vérifie l'email et réessaie."
    );
  });

  it('maps too_many_requests with a cooldown hint', () => {
    expect(friendlyAuthError({ errors: [{ code: 'too_many_requests' }] })).toBe(
      "Beaucoup de tentatives... Attends une minute avant de réessayer."
    );
  });

  it('falls back to longMessage when the code is unknown', () => {
    expect(
      friendlyAuthError({
        errors: [{ code: 'something_unknown', longMessage: 'Detailed explanation here' }],
      })
    ).toBe('Detailed explanation here');
  });

  it('falls back to message when longMessage is absent', () => {
    expect(
      friendlyAuthError({
        errors: [{ code: 'something_unknown', message: 'Short msg' }],
      })
    ).toBe('Short msg');
  });

  it('returns generic message when there is nothing usable', () => {
    expect(friendlyAuthError(undefined)).toBe('Oups, une erreur est survenue.');
    expect(friendlyAuthError({})).toBe('Oups, une erreur est survenue.');
    expect(friendlyAuthError({ errors: [] })).toBe('Oups, une erreur est survenue.');
    expect(friendlyAuthError({ errors: [{}] })).toBe('Oups, une erreur est survenue.');
  });

  it('does not leak raw error codes to the user', () => {
    // Sanity: the friendly message must never literally contain the technical code.
    const codes = [
      'form_password_incorrect',
      'form_identifier_not_found',
      'form_identifier_exists',
      'session_exists',
      'form_password_pwned',
      'form_password_length_too_short',
      'verification_failed',
      'form_code_incorrect',
      'too_many_requests',
    ];
    for (const code of codes) {
      const msg = friendlyAuthError({ errors: [{ code }] });
      expect(msg).not.toContain(code);
      expect(msg).not.toContain('form_');
    }
  });
});
