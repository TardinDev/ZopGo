/**
 * buildLivraisonTimeline turns the livraison row's timestamp columns into
 * the ordered lifecycle the detail page renders. These tests pin down the
 * two things that actually matter: only-real-steps-show, and they come out
 * in chronological order regardless of column order.
 */

import { buildLivraisonTimeline } from "../timeline";

const base = {
    created_at: "2026-01-01T10:00:00Z",
    accepted_at: null,
    picked_up_at: null,
    delivered_at: null,
    cancelled_at: null,
};

describe("buildLivraisonTimeline", () => {
    it("returns only the 'created' step for a brand-new livraison", () => {
        const steps = buildLivraisonTimeline(base);
        expect(steps).toHaveLength(1);
        expect(steps[0].key).toBe("created");
        expect(steps[0].color).toBe("blue");
    });

    it("includes every step that has a timestamp, in chronological order", () => {
        const steps = buildLivraisonTimeline({
            created_at: "2026-01-01T10:00:00Z",
            accepted_at: "2026-01-01T10:05:00Z",
            picked_up_at: "2026-01-01T10:20:00Z",
            delivered_at: "2026-01-01T11:00:00Z",
            cancelled_at: null,
        });
        expect(steps.map((s) => s.key)).toEqual([
            "created",
            "accepted",
            "picked_up",
            "delivered",
        ]);
        // Delivered is the terminal success step → green.
        expect(steps[steps.length - 1].color).toBe("green");
    });

    it("orders by timestamp, not by column lifecycle order", () => {
        // A cancellation that happened before a (stale) picked_up timestamp
        // should still sort by the real clock time.
        const steps = buildLivraisonTimeline({
            created_at: "2026-01-01T10:00:00Z",
            accepted_at: "2026-01-01T10:05:00Z",
            picked_up_at: null,
            delivered_at: null,
            cancelled_at: "2026-01-01T10:10:00Z",
        });
        expect(steps.map((s) => s.key)).toEqual([
            "created",
            "accepted",
            "cancelled",
        ]);
        expect(steps[steps.length - 1].color).toBe("red");
    });

    it("breaks timestamp ties using lifecycle order", () => {
        const sameInstant = "2026-01-01T10:00:00Z";
        const steps = buildLivraisonTimeline({
            created_at: sameInstant,
            accepted_at: sameInstant,
            picked_up_at: null,
            delivered_at: null,
            cancelled_at: null,
        });
        expect(steps.map((s) => s.key)).toEqual(["created", "accepted"]);
    });
});
