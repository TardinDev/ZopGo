/**
 * Display-name resolution shared by the trajet / reservation detail pages.
 *
 * A transporteur can be an individual `chauffeur` (we show their personal
 * name + avatar) or a travel `agence` (we show the agency brand name +
 * logo, exactly like the mobile VoyageCard does). Centralising this keeps
 * the two detail pages from drifting apart.
 */
import type { DbProfile } from "@/types";

export type ResolvedIdentity = {
    name: string;
    avatar: string | undefined;
    isAgence: boolean;
};

/**
 * Resolves how a profile should be presented. For an `agence` we prefer
 * the agency name + logo, falling back to the personal fields when the
 * agency identity isn't filled in yet.
 */
export function resolveIdentity(
    profile: Pick<
        DbProfile,
        "name" | "avatar" | "role" | "agency_name" | "agency_logo_url"
    > | null | undefined
): ResolvedIdentity {
    if (!profile) {
        return { name: "—", avatar: undefined, isAgence: false };
    }
    const isAgence = profile.role === "agence";
    if (isAgence) {
        return {
            name: profile.agency_name ?? profile.name ?? "—",
            avatar: profile.agency_logo_url ?? profile.avatar ?? undefined,
            isAgence: true,
        };
    }
    return {
        name: profile.name ?? "—",
        avatar: profile.avatar ?? undefined,
        isAgence: false,
    };
}
