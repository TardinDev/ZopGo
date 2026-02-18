-- ============================================
-- ZopGo — Admin RLS Policies (Migration 006)
-- ============================================
-- PREREQUIS : Migration 004 appliquée
--
-- Ajoute des policies RLS parallèles pour les admins.
-- Le JWT Clerk doit inclure :
--   { "sub": "...", "admin_role": "{{user.public_metadata.role}}" }
--
-- N'ÉCRASE PAS les policies existantes.
-- ============================================

-- ============================================
-- Helper : vérifie si le JWT contient un rôle admin
-- ============================================

-- === PROFILES ===
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

-- === VEHICLES ===
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

-- === TRIPS ===
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

-- === DELIVERIES ===
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

-- === TRAJETS ===
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

-- === NOTIFICATIONS ===
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

-- === AUDIT LOG (lecture seule pour admins) ===
-- Note : audit_log a déjà une policy "audit_log_select" USING(true)
-- mais on ajoute une policy explicite admin pour la cohérence
CREATE POLICY "admin_audit_log_select"
  ON public.audit_log FOR SELECT
  USING (
    (auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin')
  );
