/**
 * Smoke tests for the central label/enum maps.
 *
 * Why this matters: the labels are referenced from every filter dropdown
 * and Tag in the admin UI. A stray rename (e.g. chauffeur → Transporteur)
 * or a missing role (e.g. agence) silently leaves the dropdown filter
 * with a blank option instead of throwing — these tests pin down the
 * shape so refactors must update both code and tests together.
 */

import {
    USER_ROLE_LABELS,
    RESERVATION_STATUS_LABELS,
    TRAJET_STATUS_LABELS,
    HEBERGEMENT_TYPE_LABELS,
    HEBERGEMENT_STATUS_LABELS,
    ADMIN_MESSAGE_TARGET_LABELS,
} from "@/config/constants";

describe("USER_ROLE_LABELS", () => {
    it("covers the 4 supported roles", () => {
        expect(Object.keys(USER_ROLE_LABELS).sort()).toEqual([
            "agence",
            "chauffeur",
            "client",
            "hebergeur",
        ]);
    });

    it("uses 'Transporteur' (not the legacy 'Chauffeur') for the chauffeur role", () => {
        // The role can now offer plane/train/boat trips via the agence flow,
        // so the user-facing label is 'Transporteur'.
        expect(USER_ROLE_LABELS.chauffeur).toBe("Transporteur");
    });

    it("exposes the gated 'Agence' label", () => {
        expect(USER_ROLE_LABELS.agence).toBe("Agence");
    });
});

describe("RESERVATION_STATUS_LABELS", () => {
    it("covers the 4 reservation statuses (matches DB CHECK constraint)", () => {
        expect(Object.keys(RESERVATION_STATUS_LABELS).sort()).toEqual([
            "acceptee",
            "annulee",
            "en_attente",
            "refusee",
        ]);
    });
});

describe("TRAJET_STATUS_LABELS", () => {
    it("covers the 3 trajet statuses", () => {
        expect(Object.keys(TRAJET_STATUS_LABELS).sort()).toEqual([
            "complet",
            "effectue",
            "en_attente",
        ]);
    });
});

describe("HEBERGEMENT_TYPE_LABELS", () => {
    it("covers the 5 supported lodging types", () => {
        expect(Object.keys(HEBERGEMENT_TYPE_LABELS).sort()).toEqual([
            "appartement",
            "auberge",
            "chambre",
            "hotel",
            "maison",
        ]);
    });
});

describe("HEBERGEMENT_STATUS_LABELS", () => {
    it("only exposes the two states the form can write", () => {
        expect(Object.keys(HEBERGEMENT_STATUS_LABELS).sort()).toEqual([
            "actif",
            "inactif",
        ]);
    });
});

describe("ADMIN_MESSAGE_TARGET_LABELS", () => {
    it("supports user / role / all targeting", () => {
        expect(Object.keys(ADMIN_MESSAGE_TARGET_LABELS).sort()).toEqual([
            "all",
            "role",
            "user",
        ]);
    });
});
