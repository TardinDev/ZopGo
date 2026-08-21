/**
 * Traduit la colonne `performed_by` du journal d'audit en libellé lisible.
 *
 * Le déclencheur enregistre `coalesce(auth.jwt() ->> 'sub', 'system')`, donc
 * un identifiant Clerk brut la plupart du temps. Affiché tel quel, il ne dit
 * rien à personne — or le journal ne sert qu'à répondre à « qui a fait ça ».
 *
 * Trois cas particuliers méritent d'être distingués d'un compte nominatif :
 *
 *   `system`         — écriture sans session : maintenance directe en base,
 *                      ou déclencheur exécuté hors requête authentifiée
 *   `clerk-webhook`  — la fonction serveur, sur événement Clerk
 *   compte retiré    — un identifiant qui ne correspond plus à aucun profil
 *
 * Ce dernier cas n'est pas une anomalie : la bascule d'instance Clerk du
 * 2026-08-20 a retiré les identifiants d'origine des entrées antérieures.
 * Elles n'ont pas été réécrites — falsifier un journal d'audit lui ôterait sa
 * raison d'être — donc l'affichage doit assumer leur existence plutôt que de
 * montrer une chaîne opaque.
 */

export type ActorKind = "personne" | "systeme" | "webhook" | "retire";

export interface ActorLabel {
    kind: ActorKind;
    label: string;
    /** Identifiant d'origine, à afficher en infobulle pour l'investigation. */
    raw: string;
}

const SPECIAUX: Record<string, { kind: ActorKind; label: string }> = {
    system: { kind: "systeme", label: "Système" },
    "clerk-webhook": { kind: "webhook", label: "Webhook Clerk" },
};

/**
 * @param performedBy valeur brute de la colonne
 * @param nomsParClerkId correspondance clerk_id → nom, pour la page courante
 */
export function describeActor(
    performedBy: string | null | undefined,
    nomsParClerkId: Record<string, string>
): ActorLabel {
    const raw = performedBy ?? "";

    if (!raw) {
        return { kind: "systeme", label: "Système", raw };
    }

    const special = SPECIAUX[raw];
    if (special) {
        return { ...special, raw };
    }

    const nom = nomsParClerkId[raw];
    if (nom) {
        return { kind: "personne", label: nom, raw };
    }

    return { kind: "retire", label: "Compte retiré", raw };
}
