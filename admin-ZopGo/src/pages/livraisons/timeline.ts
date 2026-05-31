/**
 * Pure helper — turns a livraison row's timestamp columns into an ordered
 * lifecycle timeline the detail page can render with an Ant <Timeline>.
 *
 * A livraison always has `created_at`; the rest (`accepted_at`,
 * `picked_up_at`, `delivered_at`, `cancelled_at`) fill in as the course
 * progresses. We only surface the steps that actually happened so the
 * admin sees the real history, not a speculative funnel.
 */
import type { DbLivraison } from "@/types";

export type LivraisonTimelineStep = {
    key: "created" | "accepted" | "picked_up" | "delivered" | "cancelled";
    label: string;
    at: string;
    /** Ant Timeline dot color. */
    color: "blue" | "green" | "red" | "gray";
};

const STEP_LABELS: Record<LivraisonTimelineStep["key"], string> = {
    created: "Commande créée",
    accepted: "Acceptée par le livreur",
    picked_up: "Colis récupéré",
    delivered: "Livré",
    cancelled: "Annulée",
};

const STEP_COLORS: Record<LivraisonTimelineStep["key"], LivraisonTimelineStep["color"]> = {
    created: "blue",
    accepted: "blue",
    picked_up: "blue",
    delivered: "green",
    cancelled: "red",
};

/**
 * Builds the timeline, sorted chronologically by timestamp. Steps without
 * a timestamp are omitted. Equal timestamps keep their lifecycle order.
 */
export function buildLivraisonTimeline(
    livraison: Pick<
        DbLivraison,
        | "created_at"
        | "accepted_at"
        | "picked_up_at"
        | "delivered_at"
        | "cancelled_at"
    >
): LivraisonTimelineStep[] {
    const raw: { key: LivraisonTimelineStep["key"]; at: string | null }[] = [
        { key: "created", at: livraison.created_at },
        { key: "accepted", at: livraison.accepted_at },
        { key: "picked_up", at: livraison.picked_up_at },
        { key: "delivered", at: livraison.delivered_at },
        { key: "cancelled", at: livraison.cancelled_at },
    ];

    return raw
        .filter((s): s is { key: LivraisonTimelineStep["key"]; at: string } =>
            Boolean(s.at)
        )
        .map((s, lifecycleIndex) => ({ ...s, lifecycleIndex }))
        .sort((a, b) => {
            const ta = new Date(a.at).getTime();
            const tb = new Date(b.at).getTime();
            if (ta !== tb) return ta - tb;
            return a.lifecycleIndex - b.lifecycleIndex;
        })
        .map(({ key, at }) => ({
            key,
            at,
            label: STEP_LABELS[key],
            color: STEP_COLORS[key],
        }));
}
