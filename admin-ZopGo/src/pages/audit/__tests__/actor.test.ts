/**
 * describeActor traduit `performed_by` en libellé lisible.
 *
 * Le cas qui compte le plus est « compte retiré » : la bascule d'instance
 * Clerk a laissé 677 entrées portant des identifiants qui ne correspondent
 * plus à aucun profil. Elles ne seront jamais réécrites, donc l'affichage
 * doit les nommer explicitement plutôt que d'exposer une chaîne opaque — et
 * surtout sans les confondre avec une écriture système.
 */

import { describeActor } from "../actor";

const noms = {
    user_abc: "MALEHOU Benjamin",
    user_def: "Jemina Maganga",
};

describe("describeActor", () => {
    it("nomme un compte connu", () => {
        const a = describeActor("user_abc", noms);

        expect(a.kind).toBe("personne");
        expect(a.label).toBe("MALEHOU Benjamin");
        expect(a.raw).toBe("user_abc");
    });

    it("distingue une écriture système", () => {
        const a = describeActor("system", noms);

        expect(a.kind).toBe("systeme");
        expect(a.label).toBe("Système");
    });

    it("distingue le webhook Clerk", () => {
        const a = describeActor("clerk-webhook", noms);

        expect(a.kind).toBe("webhook");
        expect(a.label).toBe("Webhook Clerk");
    });

    it("signale un compte retiré sans le confondre avec le système", () => {
        const a = describeActor("user_dune_instance_disparue", noms);

        expect(a.kind).toBe("retire");
        expect(a.label).toBe("Compte retiré");
        expect(a.kind).not.toBe("systeme");
    });

    it("conserve l’identifiant d’origine pour l’investigation", () => {
        const a = describeActor("user_inconnu_xyz", noms);

        expect(a.raw).toBe("user_inconnu_xyz");
    });

    it("traite une valeur absente comme une écriture système", () => {
        expect(describeActor(null, noms).kind).toBe("systeme");
        expect(describeActor(undefined, noms).kind).toBe("systeme");
        expect(describeActor("", noms).kind).toBe("systeme");
    });

    it("ne nomme personne quand la correspondance est vide", () => {
        // Cas du premier rendu, avant que les profils soient chargés : mieux
        // vaut « compte retiré » transitoire qu'un identifiant brut affiché.
        expect(describeActor("user_abc", {}).kind).toBe("retire");
    });
});
