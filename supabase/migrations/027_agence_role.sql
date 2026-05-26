-- 027_agence_role.sql
-- ============================================
-- ZopGo — Add 'agence' user role + agency profile fields
-- ============================================
-- An "agence" is a gated transporteur sub-role for travel agencies that sell
-- Bus / Train / Avion / Bateaux tickets. Unlike client/chauffeur/hebergeur
-- (which are granted to every account via migration 024), 'agence' is only
-- granted to accounts that signed up with a valid invitation code
-- (see migration 028).
--
-- This migration:
--   1. Widens every role CHECK constraint to allow 'agence'
--   2. Adds agency_name + agency_logo_url columns to profiles
--   3. Adds a partial index on profiles where role = 'agence' for fast lookup
-- ============================================

-- ============================================
-- 1. profiles.role  — legacy single-role column
-- ============================================
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('client', 'chauffeur', 'hebergeur', 'agence'));

-- ============================================
-- 2. profiles.roles[]  — multi-role array (migration 023)
-- ============================================
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_roles_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_roles_check
  CHECK (
    array_length(roles, 1) >= 1
    AND roles <@ ARRAY['client', 'chauffeur', 'hebergeur', 'agence']::text[]
  );

-- ============================================
-- 3. notifications.recipient_role
-- ============================================
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_recipient_role_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_recipient_role_check
  CHECK (recipient_role IN ('client', 'chauffeur', 'hebergeur', 'agence', 'all'));

-- ============================================
-- 4. admin_messages.target_role  (migration 018)
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_messages') THEN
    EXECUTE 'ALTER TABLE public.admin_messages DROP CONSTRAINT IF EXISTS admin_messages_target_role_check';
    EXECUTE $f$ALTER TABLE public.admin_messages
      ADD CONSTRAINT admin_messages_target_role_check
      CHECK (target_role IN ('client', 'chauffeur', 'hebergeur', 'agence'))$f$;
  END IF;
END$$;

-- ============================================
-- 5. New agency profile columns
-- ============================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS agency_name text,
  ADD COLUMN IF NOT EXISTS agency_logo_url text;

COMMENT ON COLUMN public.profiles.agency_name IS
  'Display name of the travel agency. NULL for non-agence accounts.';
COMMENT ON COLUMN public.profiles.agency_logo_url IS
  'Public URL of the agency logo (Supabase storage bucket "agency-logos"). NULL for non-agence accounts.';

-- ============================================
-- 6. Soft invariant: when role = 'agence', agency_name should be present
--    Enforced by application code; left out of CHECK to keep migrations
--    idempotent on partial backfills.
-- ============================================

-- ============================================
-- 7. Index for fast "list all agences" queries (admin dashboards, future)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_role_agence
  ON public.profiles(id)
  WHERE role = 'agence';

-- ============================================
-- 8. agency-logos storage bucket
--    Public-read so logos can be rendered on VoyageCard without auth.
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('agency-logos', 'agency-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for the new bucket — only the owner agence may upload
-- their own logo; everyone may read.
DROP POLICY IF EXISTS "agency_logos_public_read" ON storage.objects;
CREATE POLICY "agency_logos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'agency-logos');

DROP POLICY IF EXISTS "agency_logos_owner_write" ON storage.objects;
CREATE POLICY "agency_logos_owner_write"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'agency-logos'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.profiles
      WHERE clerk_id = (auth.jwt() ->> 'sub')
        AND role = 'agence'
    )
  );

DROP POLICY IF EXISTS "agency_logos_owner_update" ON storage.objects;
CREATE POLICY "agency_logos_owner_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'agency-logos'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.profiles
      WHERE clerk_id = (auth.jwt() ->> 'sub')
        AND role = 'agence'
    )
  );
