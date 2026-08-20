/**
 * buildTrajetPayload transforme le formulaire admin en ligne insérable.
 *
 * Ce qui compte vraiment ici : les champs optionnels laissés vides doivent
 * partir en NULL et non en chaîne vide — le mobile assemble
 * `[immatriculation, modele, couleur].filter(Boolean)` (VoyageCard.tsx:33),
 * et une chaîne vide y produirait des séparateurs orphelins du type « · · ».
 * Et les villes doivent être détourées, une espace finale cassant la
 * recherche par ville côté client.
 */

import { buildTrajetPayload } from "../payload";

const base = {
    chauffeur_id: "profile-uuid",
    ville_depart: "Libreville",
    ville_arrivee: "Port-Gentil",
    vehicule: "voiture",
    prix: 15000,
    places_disponibles: 4,
};

describe("buildTrajetPayload", () => {
    it("conserve les champs obligatoires tels quels", () => {
        const p = buildTrajetPayload(base);

        expect(p.chauffeur_id).toBe("profile-uuid");
        expect(p.ville_depart).toBe("Libreville");
        expect(p.ville_arrivee).toBe("Port-Gentil");
        expect(p.vehicule).toBe("voiture");
        expect(p.prix).toBe(15000);
        expect(p.places_disponibles).toBe(4);
    });

    it("met les champs véhicule optionnels à NULL quand ils sont absents", () => {
        const p = buildTrajetPayload(base);

        expect(p.immatriculation).toBeNull();
        expect(p.modele).toBeNull();
        expect(p.couleur).toBeNull();
    });

    it("met à NULL un champ optionnel rempli d'espaces", () => {
        const p = buildTrajetPayload({
            ...base,
            immatriculation: "   ",
            modele: "",
            couleur: "\t",
        });

        expect(p.immatriculation).toBeNull();
        expect(p.modele).toBeNull();
        expect(p.couleur).toBeNull();
    });

    it("détoure les champs optionnels renseignés", () => {
        const p = buildTrajetPayload({
            ...base,
            immatriculation: "  GA-123-LBV  ",
            modele: " Toyota Hiace ",
            couleur: " blanc ",
        });

        expect(p.immatriculation).toBe("GA-123-LBV");
        expect(p.modele).toBe("Toyota Hiace");
        expect(p.couleur).toBe("blanc");
    });

    it("détoure les villes — une espace finale casse la recherche client", () => {
        const p = buildTrajetPayload({
            ...base,
            ville_depart: "  Libreville ",
            ville_arrivee: " Lambaréné  ",
        });

        expect(p.ville_depart).toBe("Libreville");
        expect(p.ville_arrivee).toBe("Lambaréné");
    });

    it("convertit la date en ISO", () => {
        const p = buildTrajetPayload({
            ...base,
            date: { toISOString: () => "2026-12-01T08:00:00.000Z" },
        });

        expect(p.date).toBe("2026-12-01T08:00:00.000Z");
    });

    it("accepte un trajet sans date — le champ est optionnel", () => {
        expect(buildTrajetPayload(base).date).toBeNull();
        expect(buildTrajetPayload({ ...base, date: null }).date).toBeNull();
    });
});
