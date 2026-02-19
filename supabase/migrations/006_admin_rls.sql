-- ============================================
-- ZopGo — Admin RLS Policies (Migration 006)
-- ============================================
-- PREREQUIS : Le JWT Clerk doit inclure :
--   { "sub": "...", "admin_role": "{{user.public_metadata.role}}" }
--
-- N'ÉCRASE PAS les policies existantes — les ajoute en parallèle.
-- ============================================

-- ============================================
-- 0. Créer la table audit_log si elle n'existe pas
--    (normalement dans 004, mais peut ne pas avoir été appliquée)
-- ============================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id text NOT NULL,
  action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data jsonb,
  new_data jsonb,
  performed_by text,
  performed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Policies de base audit_log (INSERT seul = immutable)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'audit_log_insert' AND tablename = 'audit_log') THEN
    CREATE POLICY "audit_log_insert" ON public.audit_log FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'audit_log_select' AND tablename = 'audit_log') THEN
    CREATE POLICY "audit_log_select" ON public.audit_log FOR SELECT USING (true);
  END IF;
END $$;

-- ============================================
-- 1. Admin policies — PROFILES
-- ============================================
CREATE POLICY "admin_profiles_select"
  ON public.profiles FOR SELECT
  USING (
    (auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin')
  );

CREATE POLICY "admin_profiles_update"
  ON public.profiles FOR UPDATE
  USING (
    (auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin')
  )
  WITH CHECK (
    (auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin')
  );

-- ============================================
-- 2. Admin policies — VEHICLES
-- ============================================
CREATE POLICY "admin_vehicles_select"
  ON public.vehicles FOR SELECT
  USING (
    (auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin')
  );

CREATE POLICY "admin_vehicles_update"
  ON public.vehicles FOR UPDATE
  USING (
    (auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin')
  )
  WITH CHECK (
    (auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin')
  );

-- ============================================
-- 3. Admin policies — TRIPS
-- ============================================
CREATE POLICY "admin_trips_select"
  ON public.trips FOR SELECT
  USING (
    (auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin')
  );

CREATE POLICY "admin_trips_update"
  ON public.trips FOR UPDATE
  USING (
    (auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin')
  )
  WITH CHECK (
    (auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin')
  );

-- ============================================
-- 4. Admin policies — DELIVERIES
-- ============================================
CREATE POLICY "admin_deliveries_select"
  ON public.deliveries FOR SELECT
  USING (
    (auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin')
  );

CREATE POLICY "admin_deliveries_update"
  ON public.deliveries FOR UPDATE
  USING (
    (auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin')
  )
  WITH CHECK (
    (auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin')
  );

-- ============================================
-- 5. Admin policies — TRAJETS
-- ============================================
CREATE POLICY "admin_trajets_select"
  ON public.trajets FOR SELECT
  USING (
    (auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin')
  );

CREATE POLICY "admin_trajets_update"
  ON public.trajets FOR UPDATE
  USING (
    (auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin')
  )
  WITH CHECK (
    (auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin')
  );

-- ============================================
-- 6. Admin policies — NOTIFICATIONS
-- ============================================
CREATE POLICY "admin_notifications_select"
  ON public.notifications FOR SELECT
  USING (
    (auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin')
  );

CREATE POLICY "admin_notifications_update"
  ON public.notifications FOR UPDATE
  USING (
    (auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin')
  )
  WITH CHECK (
    (auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin')
  );

-- ============================================
-- 7. Admin policies — AUDIT LOG (lecture seule)
-- ============================================
CREATE POLICY "admin_audit_log_select"
  ON public.audit_log FOR SELECT
  USING (
    (auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin')
  );
