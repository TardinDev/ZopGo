/**
 * The moderation toggles are reversible: hiding then un-hiding a message
 * (or suspending then restoring a user) must return the row to its
 * original state. These tests pin that the un-hide branch resets EVERY
 * column, not just the timestamp — the bug that would leave a message
 * flagged `hidden_by_admin` forever.
 */

import { hideMessagePayload, suspendProfilePayload } from "../moderation";

const NOW = "2026-05-31T09:00:00.000Z";

describe("hideMessagePayload", () => {
    it("stamps deleted_at + flags admin when hiding", () => {
        expect(hideMessagePayload(true, NOW)).toEqual({
            deleted_at: NOW,
            hidden_by_admin: true,
        });
    });

    it("clears BOTH columns when un-hiding", () => {
        expect(hideMessagePayload(false, NOW)).toEqual({
            deleted_at: null,
            hidden_by_admin: false,
        });
    });
});

describe("suspendProfilePayload", () => {
    it("stamps deleted_at when suspending", () => {
        expect(suspendProfilePayload(true, NOW)).toEqual({ deleted_at: NOW });
    });

    it("clears deleted_at when restoring", () => {
        expect(suspendProfilePayload(false, NOW)).toEqual({ deleted_at: null });
    });
});
