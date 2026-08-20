/**
 * buildHebergementPayload transforme le formulaire admin en ligne insérable.
 *
 * L'enjeu diffère de celui des trajets : `adresse` et `description` sont
 * NOT NULL en base. Un champ laissé vide doit donc produire une chaîne vide,
 * et surtout pas NULL, qui ferait échouer l'insertion.
 *
 * `disponibilite` par défaut à 0 est délibéré : un logement tout juste créé
 * n'accueille personne tant que l'hébergeur n'a pas déclaré ses places. Le
 * mettre à 1 le rendrait réservable à l'insu de son propriétaire.
 */

import { buildHebergementPayload } from "../payload";

const base = {
    hebergeur_id: "profile-uuid",
    nom: "Villa des Palmiers",
    type: "villa",
    ville: "Libreville",
    prix_par_nuit: 45000,
    status: "actif",
};

describe("buildHebergementPayload", () => {
    it("conserve les champs obligatoires", () => {
        const p = buildHebergementPayload(base);

        expect(p.hebergeur_id).toBe("profile-uuid");
        expect(p.nom).toBe("Villa des Palmiers");
        expect(p.type).toBe("villa");
        expect(p.ville).toBe("Libreville");
        expect(p.prix_par_nuit).toBe(45000);
        expect(p.status).toBe("actif");
    });

    it("produit une chaîne vide, jamais null, pour les colonnes NOT NULL", () => {
        const p = buildHebergementPayload(base);

        expect(p.adresse).toBe("");
        expect(p.description).toBe("");
        expect(p.adresse).not.toBeNull();
        expect(p.description).not.toBeNull();
    });

    it("détoure adresse et description", () => {
        const p = buildHebergementPayload({
            ...base,
            adresse: "  Quartier Glass  ",
            description: "  Vue sur mer  ",
        });

        expect(p.adresse).toBe("Quartier Glass");
        expect(p.description).toBe("Vue sur mer");
    });

    it("ramène à une chaîne vide un champ ne contenant que des espaces", () => {
        const p = buildHebergementPayload({
            ...base,
            adresse: "   ",
            description: "\t",
        });

        expect(p.adresse).toBe("");
        expect(p.description).toBe("");
    });

    it("détoure le nom", () => {
        expect(buildHebergementPayload({ ...base, nom: "  Chez Awa " }).nom).toBe(
            "Chez Awa"
        );
    });

    it("laisse le logement indisponible par défaut", () => {
        const p = buildHebergementPayload(base);

        expect(p.disponibilite).toBe(0);
        expect(p.capacite).toBe(1);
    });

    it("respecte capacité et disponibilité quand elles sont fournies", () => {
        const p = buildHebergementPayload({
            ...base,
            capacite: 6,
            disponibilite: 3,
        });

        expect(p.capacite).toBe(6);
        expect(p.disponibilite).toBe(3);
    });

    it("distingue une disponibilité de 0 explicite d'une absence de valeur", () => {
        // 0 est une valeur légitime : `?? 0` ne doit pas la confondre avec
        // undefined, contrairement à ce que ferait `|| 0`.
        expect(buildHebergementPayload({ ...base, disponibilite: 0 }).disponibilite).toBe(0);
        expect(buildHebergementPayload({ ...base, capacite: 0 }).capacite).toBe(0);
    });
});
