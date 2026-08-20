/**
 * Normalisation du formulaire de création d'hébergement avant insertion.
 *
 * Extrait du composant pour être testable, comme `trajets/payload.ts`.
 *
 * Deux différences avec les trajets, dictées par le schéma : `adresse` et
 * `description` sont NOT NULL en base, donc un champ vide doit produire une
 * chaîne vide et surtout pas NULL. Tandis que `disponibilite`, `amenities` et
 * `periode_tarif` sont omis volontairement pour laisser agir leurs valeurs par
 * défaut — les renseigner ici les figerait sans que l'admin en décide.
 */

export interface HebergementFormValues {
    hebergeur_id: string;
    nom: string;
    type: string;
    ville: string;
    prix_par_nuit: number;
    status: string;
    adresse?: string;
    description?: string;
    capacite?: number;
    disponibilite?: number;
}

export interface HebergementInsertPayload {
    hebergeur_id: string;
    nom: string;
    type: string;
    ville: string;
    prix_par_nuit: number;
    status: string;
    adresse: string;
    description: string;
    capacite: number;
    disponibilite: number;
}

export function buildHebergementPayload(
    values: HebergementFormValues
): HebergementInsertPayload {
    return {
        hebergeur_id: values.hebergeur_id,
        nom: values.nom.trim(),
        type: values.type,
        ville: values.ville,
        prix_par_nuit: values.prix_par_nuit,
        status: values.status,
        // NOT NULL en base : chaîne vide, jamais null.
        adresse: values.adresse?.trim() ?? "",
        description: values.description?.trim() ?? "",
        // Un logement accueille au moins une personne, et reste indisponible
        // tant que l'hébergeur n'a pas déclaré combien de places il ouvre.
        capacite: values.capacite ?? 1,
        disponibilite: values.disponibilite ?? 0,
    };
}
