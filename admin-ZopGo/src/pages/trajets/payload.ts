/**
 * Normalisation du formulaire de création de trajet avant insertion.
 *
 * Extrait du composant pour être testable, comme `timeline.ts` l'est pour la
 * page livraisons. C'est ici que se logent les erreurs discrètes : un champ
 * laissé vide qui part en chaîne vide plutôt qu'en NULL, ou une ville avec
 * une espace finale qui casse ensuite la recherche par ville côté mobile.
 */

/** Ce que fournit AntD : un objet type Day.js pour le champ date. */
export interface TrajetFormValues {
    chauffeur_id: string;
    ville_depart: string;
    ville_arrivee: string;
    vehicule: string;
    prix: number;
    places_disponibles: number;
    date?: { toISOString(): string } | null;
    immatriculation?: string;
    modele?: string;
    couleur?: string;
}

export interface TrajetInsertPayload {
    chauffeur_id: string;
    ville_depart: string;
    ville_arrivee: string;
    vehicule: string;
    prix: number;
    places_disponibles: number;
    date: string | null;
    immatriculation: string | null;
    modele: string | null;
    couleur: string | null;
}

/** Champ optionnel : on veut NULL en base, jamais une chaîne vide. */
function optionalText(value: string | undefined): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
}

export function buildTrajetPayload(values: TrajetFormValues): TrajetInsertPayload {
    return {
        chauffeur_id: values.chauffeur_id,
        ville_depart: values.ville_depart.trim(),
        ville_arrivee: values.ville_arrivee.trim(),
        vehicule: values.vehicule,
        prix: values.prix,
        places_disponibles: values.places_disponibles,
        date: values.date ? values.date.toISOString() : null,
        immatriculation: optionalText(values.immatriculation),
        modele: optionalText(values.modele),
        couleur: optionalText(values.couleur),
    };
}
