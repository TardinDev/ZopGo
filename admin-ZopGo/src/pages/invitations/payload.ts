/**
 * Normalisation du formulaire d'invitation avant envoi à l'API Clerk.
 *
 * Extrait du composant pour être testable, comme `payload.ts` l'est pour la
 * page trajets. C'est ici que se logent les erreurs discrètes : une
 * invitation mal formée n'échoue pas, elle crée un compte au mauvais rôle.
 */

/** Ce que l'API d'invitation Clerk accepte, réduit à ce qu'on lui envoie. */
export interface InvitationPayload {
    email_address: string;
    /**
     * Le rôle voyage ici et nulle part ailleurs : `public_metadata` est le
     * seul champ qu'une invitation Clerk transporte jusqu'au compte créé.
     * Mis dans `unsafe_metadata`, il serait accepté par l'API puis perdu, et
     * le webhook retomberait sur `client`.
     */
    public_metadata: { role: string };
    /** Demande à Clerk d'envoyer lui-même l'email d'invitation. */
    notify: boolean;
}

export function buildInvitationPayload(
    email: string,
    role: string
): InvitationPayload {
    // Clerk traite `A@b.com` et `a@b.com` comme deux adresses distinctes :
    // sans mise en minuscules, le compte créé serait introuvable par la
    // recherche email côté admin.
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedRole = role.trim();

    if (!normalizedEmail) {
        throw new Error("L'adresse email est obligatoire pour inviter.");
    }

    // Sans cette garde, l'invitation partirait avec un rôle vide et le
    // webhook appliquerait son défaut `client` — l'invité arriverait au
    // mauvais rôle, sans erreur nulle part.
    if (!normalizedRole) {
        throw new Error("Le rôle est obligatoire pour inviter.");
    }

    return {
        email_address: normalizedEmail,
        public_metadata: { role: normalizedRole },
        notify: true,
    };
}
