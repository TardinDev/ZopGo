/**
 * Payloads de modération partagés par les listes de l'administration.
 *
 * Ce projet ne supprime jamais physiquement : il estampille `deleted_at`, et
 * les policies de lecture filtrent sur `deleted_at IS NULL`. Un contenu retiré
 * disparaît donc de l'application mobile tout en restant consultable par
 * l'administration — et le geste reste réversible, ce qu'un DELETE ne serait
 * pas.
 *
 * Le point facile à casser est le rétablissement : il doit remettre la colonne
 * à `null`, pas à une chaîne vide ni à la date du jour. D'où un module isolé
 * et testé plutôt qu'un ternaire recopié dans chaque page.
 */

export interface SoftDeletePayload {
    deleted_at: string | null;
}

/**
 * @param retirer true pour retirer le contenu, false pour le rétablir
 * @param nowIso horodatage du retrait, ignoré lors d'un rétablissement
 */
export function softDeletePayload(
    retirer: boolean,
    nowIso: string
): SoftDeletePayload {
    return { deleted_at: retirer ? nowIso : null };
}

/** Vrai si la ligne est actuellement retirée de l'application. */
export function estRetire(row: { deleted_at?: string | null }): boolean {
    return !!row.deleted_at;
}
