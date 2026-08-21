/**
 * buildInvitationPayload transforme le formulaire d'invitation en charge
 * envoyable à l'API Clerk.
 *
 * Deux choses se jouent ici, et toutes deux échouent en silence.
 *
 * Le rôle doit atterrir dans `public_metadata` : c'est le seul champ qu'une
 * invitation Clerk transporte jusqu'au compte créé. Placé ailleurs
 * (`unsafe_metadata`, ou à la racine), il serait accepté par l'API puis
 * perdu, et le webhook retomberait sur `client` — un chauffeur invité
 * arriverait en client sans qu'aucune erreur ne l'indique.
 *
 * L'email doit être mis en minuscules : Clerk traite `A@b.com` et
 * `a@b.com` comme deux adresses distinctes. Une invitation saisie avec une
 * majuscule créerait un compte que la recherche par email côté admin ne
 * retrouverait jamais.
 */

import { buildInvitationPayload } from "../payload";

describe("buildInvitationPayload", () => {
    it("place le rôle dans public_metadata — le seul champ qu'une invitation transporte", () => {
        const p = buildInvitationPayload("chauffeur@zopgo.ga", "chauffeur");

        expect(p.public_metadata).toEqual({ role: "chauffeur" });
        // Le rôle ne doit pas se retrouver à la racine de la charge : l'API
        // l'ignorerait et le compte créé n'en porterait aucune trace.
        expect(p).not.toHaveProperty("role");
        expect(p).not.toHaveProperty("unsafe_metadata");
    });

    it("détoure l'email et le met en minuscules", () => {
        const p = buildInvitationPayload("  Hebergeur@ZopGo.GA  ", "hebergeur");

        expect(p.email_address).toBe("hebergeur@zopgo.ga");
    });

    it("demande à Clerk d'envoyer l'email d'invitation", () => {
        const p = buildInvitationPayload("chauffeur@zopgo.ga", "chauffeur");

        expect(p.notify).toBe(true);
    });

    it("conserve le rôle tel quel, sans normalisation de casse", () => {
        // Le rôle vient d'une liste fermée côté formulaire ; le transformer
        // ici masquerait une valeur inattendue au lieu de la laisser voir.
        const p = buildInvitationPayload("a@b.com", "hebergeur");

        expect(p.public_metadata.role).toBe("hebergeur");
    });

    it("refuse un email vide ou fait d'espaces", () => {
        expect(() => buildInvitationPayload("", "chauffeur")).toThrow();
        expect(() => buildInvitationPayload("   ", "chauffeur")).toThrow();
        expect(() => buildInvitationPayload("\t\n", "chauffeur")).toThrow();
    });

    it("refuse un rôle vide ou fait d'espaces", () => {
        // Sans garde, l'invitation partirait avec `role: ""` et le webhook
        // retomberait sur `client` — l'échec silencieux qu'on veut éviter.
        expect(() => buildInvitationPayload("a@b.com", "")).toThrow();
        expect(() => buildInvitationPayload("a@b.com", "   ")).toThrow();
    });
});
