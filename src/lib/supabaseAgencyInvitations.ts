import { supabase } from './supabase';

// Mirrors the JSON shape returned by the `claim_agency_code` SECURITY DEFINER
// function (supabase/migrations/028_agency_invitations.sql).
export type ClaimReason = 'invalid' | 'used' | 'expired' | 'profile_missing' | 'rpc_error';

export type ClaimResult =
  | { ok: true; agencyName: string; invitationId: string }
  | { ok: false; reason: ClaimReason; message: string };

/**
 * Validate + claim an agency invitation code in one atomic server-side call.
 *
 * The migration's stored function:
 *   1. Locks the matching invitations row FOR UPDATE
 *   2. Verifies the code exists, is unused, and is not expired
 *   3. Marks the code as used (used_at + used_by)
 *   4. Promotes the caller's profile to role='agence' and stamps
 *      agency_name from the invitation
 *   5. Returns { ok, agency_name, invitation_id } or { ok: false, reason }
 *
 * `profileId` MUST refer to a profile row that already exists (typically the
 * upsert from `setupProfile` runs first, then we call this to upgrade it to
 * agence).
 *
 * RPC-level failures (network, server) map to `rpc_error` with the raw
 * message preserved so the auth screen can surface something actionable.
 */
export async function claimAgencyCode(
  code: string,
  profileId: string
): Promise<ClaimResult> {
  const cleaned = code.trim();
  if (!cleaned) {
    return { ok: false, reason: 'invalid', message: 'Code requis.' };
  }

  const { data, error } = await supabase.rpc('claim_agency_code', {
    p_code: cleaned,
    p_profile_id: profileId,
  });

  if (error) {
    if (__DEV__) console.warn('[claimAgencyCode] RPC error', error.message);
    return {
      ok: false,
      reason: 'rpc_error',
      message: error.message || 'Impossible de vérifier le code pour le moment.',
    };
  }

  // `rpc()` returns the JSONB directly. Older Supabase clients sometimes wrap
  // it in an array — handle both shapes defensively.
  const payload = Array.isArray(data) ? data[0] : data;

  if (!payload || typeof payload !== 'object') {
    return {
      ok: false,
      reason: 'rpc_error',
      message: 'Réponse inattendue du serveur.',
    };
  }

  if (payload.ok === true && typeof payload.agency_name === 'string') {
    return {
      ok: true,
      agencyName: payload.agency_name,
      invitationId: String(payload.invitation_id ?? ''),
    };
  }

  const reason = (payload.reason as ClaimReason | undefined) ?? 'invalid';
  return { ok: false, reason, message: formatReason(reason) };
}

function formatReason(reason: ClaimReason): string {
  switch (reason) {
    case 'invalid':
      return "Code inconnu. Vérifie qu'il est correctement saisi.";
    case 'used':
      return 'Ce code a déjà été utilisé.';
    case 'expired':
      return 'Ce code a expiré. Demande-en un nouveau à ZopGo.';
    case 'profile_missing':
      return 'Profil non trouvé. Réessaie après la création du compte.';
    case 'rpc_error':
    default:
      return 'Impossible de vérifier le code pour le moment.';
  }
}
