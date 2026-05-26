-- 028_agency_invitations.sql
-- ============================================
-- ZopGo — Agency invitation codes
-- ============================================
-- A travel agency cannot self-register: an admin pre-creates an invitation
-- row with a unique code + the agency display name. At signup, the user
-- enters the code; if it validates, their profile is created with role =
-- 'agence' and agency_name is copied over from the invitation row.
--
-- Security model:
--   * Direct SELECT on the table is admin-only (don't leak codes/agency
--     names to anyone scanning).
--   * The atomic validate-and-claim happens through a SECURITY DEFINER
--     function (`claim_agency_code`) that the app calls right after the
--     profile is upserted. The function checks the code, marks it used,
--     and returns the agency name to the caller in one shot.
-- ============================================

CREATE TABLE IF NOT EXISTS public.agency_invitations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code         text NOT NULL UNIQUE,
  agency_name  text NOT NULL,
  used_at      timestamptz,
  used_by      uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  expires_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  created_by   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT agency_invitations_code_format CHECK (char_length(code) BETWEEN 6 AND 64)
);

CREATE INDEX IF NOT EXISTS idx_agency_invitations_unused
  ON public.agency_invitations (code)
  WHERE used_at IS NULL;

COMMENT ON TABLE public.agency_invitations IS
  'Single-use codes issued by admin so travel agencies can sign up as role=agence.';

-- ============================================
-- RLS: lock down direct access. All read/write happens through the
-- security-definer function below.
-- ============================================
ALTER TABLE public.agency_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agency_invitations_admin_select" ON public.agency_invitations;
CREATE POLICY "agency_invitations_admin_select"
  ON public.agency_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE clerk_id = (auth.jwt() ->> 'sub')
        AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "agency_invitations_admin_insert" ON public.agency_invitations;
CREATE POLICY "agency_invitations_admin_insert"
  ON public.agency_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE clerk_id = (auth.jwt() ->> 'sub')
        AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "agency_invitations_admin_update" ON public.agency_invitations;
CREATE POLICY "agency_invitations_admin_update"
  ON public.agency_invitations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE clerk_id = (auth.jwt() ->> 'sub')
        AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "agency_invitations_admin_delete" ON public.agency_invitations;
CREATE POLICY "agency_invitations_admin_delete"
  ON public.agency_invitations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE clerk_id = (auth.jwt() ->> 'sub')
        AND role = 'admin'
    )
  );

-- ============================================
-- Atomic validate + claim function.
-- Returns one of:
--   { ok: true,  agency_name: '...' }
--   { ok: false, reason: 'invalid' | 'used' | 'expired' | 'profile_missing' }
-- The caller MUST have already created their profile (we set used_by to
-- the profile id passed in, and set profiles.role='agence' +
-- profiles.agency_name in the same transaction).
-- ============================================
CREATE OR REPLACE FUNCTION public.claim_agency_code(
  p_code       text,
  p_profile_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation record;
  v_profile_exists boolean;
BEGIN
  -- Confirm the profile we're about to attach the code to actually exists
  -- (defense in depth against a malformed call from a stale client).
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = p_profile_id
  ) INTO v_profile_exists;

  IF NOT v_profile_exists THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'profile_missing');
  END IF;

  -- Lock the matching row to prevent two parallel signups racing on the
  -- same code (FOR UPDATE on a not-yet-claimed row).
  SELECT * INTO v_invitation
    FROM public.agency_invitations
    WHERE code = p_code
    FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid');
  END IF;

  IF v_invitation.used_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'used');
  END IF;

  IF v_invitation.expires_at IS NOT NULL AND v_invitation.expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'expired');
  END IF;

  -- Mark the code as used and stamp the profile with agence role + name.
  UPDATE public.agency_invitations
     SET used_at = now(),
         used_by = p_profile_id
   WHERE id = v_invitation.id;

  UPDATE public.profiles
     SET role = 'agence',
         agency_name = v_invitation.agency_name,
         roles = (
           SELECT ARRAY(SELECT DISTINCT unnest(coalesce(roles, ARRAY[]::text[]) || ARRAY['agence']::text[]))
         )
   WHERE id = p_profile_id;

  RETURN jsonb_build_object(
    'ok', true,
    'agency_name', v_invitation.agency_name,
    'invitation_id', v_invitation.id
  );
END
$$;

-- Anyone signed in (anon or authenticated) can attempt to claim a code.
-- The function itself enforces the validity rules.
GRANT EXECUTE ON FUNCTION public.claim_agency_code(text, uuid) TO authenticated, anon;

COMMENT ON FUNCTION public.claim_agency_code(text, uuid) IS
  'Validate and atomically claim an agency invitation code. Marks code as used and promotes the given profile to role=agence with agency_name copied from the invitation.';
