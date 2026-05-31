/**
 * resolveIdentity decides whether a transporteur shows up as a personal
 * chauffeur or a branded agence on the trajet / reservation detail pages.
 * The agence branch (brand name + logo, with graceful fallbacks) is the
 * part worth pinning — getting it wrong mis-attributes a trajet.
 */

import { resolveIdentity } from "../identity";
import type { DbProfile } from "@/types";

const chauffeur: Pick<
    DbProfile,
    "name" | "avatar" | "role" | "agency_name" | "agency_logo_url"
> = {
    name: "Jean Mabiala",
    avatar: "https://cdn/jean.png",
    role: "chauffeur",
    agency_name: null,
    agency_logo_url: null,
};

describe("resolveIdentity", () => {
    it("returns a neutral placeholder for a null profile", () => {
        const r = resolveIdentity(null);
        expect(r).toEqual({ name: "—", avatar: undefined, isAgence: false });
    });

    it("uses the personal name + avatar for an individual chauffeur", () => {
        const r = resolveIdentity(chauffeur);
        expect(r).toEqual({
            name: "Jean Mabiala",
            avatar: "https://cdn/jean.png",
            isAgence: false,
        });
    });

    it("prefers the agency brand name + logo for an agence", () => {
        const r = resolveIdentity({
            ...chauffeur,
            role: "agence",
            agency_name: "Trans-Gabon Express",
            agency_logo_url: "https://cdn/logo.png",
        });
        expect(r).toEqual({
            name: "Trans-Gabon Express",
            avatar: "https://cdn/logo.png",
            isAgence: true,
        });
    });

    it("falls back to personal fields when the agence identity is incomplete", () => {
        const r = resolveIdentity({
            ...chauffeur,
            role: "agence",
            agency_name: null,
            agency_logo_url: null,
        });
        expect(r.isAgence).toBe(true);
        expect(r.name).toBe("Jean Mabiala");
        expect(r.avatar).toBe("https://cdn/jean.png");
    });
});
