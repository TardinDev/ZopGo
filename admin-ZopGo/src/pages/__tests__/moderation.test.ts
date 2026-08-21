/**
 * softDeletePayload pilote le retrait et le rétablissement d'un contenu.
 *
 * Le geste risqué est le rétablissement : la colonne doit revenir à `null`.
 * Une chaîne vide y passerait le typage sans satisfaire `deleted_at IS NULL`,
 * et le contenu resterait invisible dans l'application — un retrait qu'on
 * croirait annulé alors qu'il ne l'est pas.
 */

import { softDeletePayload, estRetire } from "../moderation";

const now = "2026-08-21T10:00:00.000Z";

describe("softDeletePayload", () => {
    it("estampille la date au retrait", () => {
        expect(softDeletePayload(true, now)).toEqual({ deleted_at: now });
    });

    it("remet la colonne à null au rétablissement", () => {
        const p = softDeletePayload(false, now);

        expect(p.deleted_at).toBeNull();
        expect(p.deleted_at).not.toBe("");
        expect(p.deleted_at).not.toBe(now);
    });

    it("ignore l’horodatage lors d’un rétablissement", () => {
        expect(softDeletePayload(false, "n'importe quoi").deleted_at).toBeNull();
    });
});

describe("estRetire", () => {
    it("reconnaît un contenu retiré", () => {
        expect(estRetire({ deleted_at: now })).toBe(true);
    });

    it("reconnaît un contenu actif", () => {
        expect(estRetire({ deleted_at: null })).toBe(false);
        expect(estRetire({})).toBe(false);
    });

    it("ne considère pas une chaîne vide comme un retrait", () => {
        // Cohérent avec `deleted_at IS NULL` en base : seule une vraie date
        // retire le contenu.
        expect(estRetire({ deleted_at: "" })).toBe(false);
    });
});
