/**
 * Pure payload builders for the direct-message moderation actions. Kept
 * out of the React component so the toggle logic (the easy-to-break part:
 * "un-hiding must reset BOTH columns back to null/false") is unit-tested.
 */

/**
 * Update payload for hiding / un-hiding a direct message. Hiding stamps
 * `deleted_at` and flags it as an admin action; un-hiding clears both so
 * the message reappears for the participants.
 */
export function hideMessagePayload(
    hide: boolean,
    nowIso: string
): { deleted_at: string | null; hidden_by_admin: boolean } {
    return {
        deleted_at: hide ? nowIso : null,
        hidden_by_admin: hide,
    };
}

/**
 * Update payload for suspending / restoring a profile (mirrors the
 * users/show suspend action). Suspending stamps `deleted_at`; restoring
 * clears it.
 */
export function suspendProfilePayload(
    suspend: boolean,
    nowIso: string
): { deleted_at: string | null } {
    return { deleted_at: suspend ? nowIso : null };
}
