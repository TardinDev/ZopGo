-- ============================================
-- ZopGo - Security Hardening (Migration 004)
-- ============================================
-- PREREQUIS : Migration 003 appliquee
-- ============================================

-- ============================================
-- 1a. Extension pgcrypto
-- ============================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- 1b. Table audit_log immutable
-- ============================================
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

-- Seul INSERT autorise (immutable — pas d'UPDATE ni DELETE)
CREATE POLICY "audit_log_insert"
  ON public.audit_log FOR INSERT
  WITH CHECK (true);

CREATE POLICY "audit_log_select"
  ON public.audit_log FOR SELECT
  USING (true);

-- Trigger function generique
CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (table_name, record_id, action, new_data, performed_by)
    VALUES (TG_TABLE_NAME, NEW.id::text, 'INSERT', to_jsonb(NEW), coalesce(auth.jwt() ->> 'sub', 'system'));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (table_name, record_id, action, old_data, new_data, performed_by)
    VALUES (TG_TABLE_NAME, NEW.id::text, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), coalesce(auth.jwt() ->> 'sub', 'system'));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (table_name, record_id, action, old_data, performed_by)
    VALUES (TG_TABLE_NAME, OLD.id::text, 'DELETE', to_jsonb(OLD), coalesce(auth.jwt() ->> 'sub', 'system'));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attacher le trigger aux tables principales
CREATE TRIGGER audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_trips
  AFTER INSERT OR UPDATE OR DELETE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_deliveries
  AFTER INSERT OR UPDATE OR DELETE ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_trajets
  AFTER INSERT OR UPDATE OR DELETE ON public.trajets
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_notifications
  AFTER INSERT OR UPDATE OR DELETE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- ============================================
-- 1c. Soft delete — colonnes deleted_at
-- ============================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.trajets ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Partial indexes pour les requetes courantes (lignes non supprimees)
CREATE INDEX IF NOT EXISTS idx_profiles_active ON public.profiles(clerk_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_vehicles_active ON public.vehicles(owner_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_trips_active ON public.trips(status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_deliveries_active ON public.deliveries(status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_active ON public.notifications(recipient_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_trajets_active ON public.trajets(chauffeur_id) WHERE deleted_at IS NULL;

-- Mettre a jour les RLS SELECT pour filtrer deleted_at IS NULL
-- On drop+recreate les policies SELECT de la migration 003

-- profiles_select : lecture publique mais pas les soft-deleted
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT
  USING (deleted_at IS NULL);

-- vehicles_select
DROP POLICY IF EXISTS "vehicles_select" ON public.vehicles;
CREATE POLICY "vehicles_select"
  ON public.vehicles FOR SELECT
  USING (deleted_at IS NULL);

-- trips_select
DROP POLICY IF EXISTS "trips_select" ON public.trips;
CREATE POLICY "trips_select"
  ON public.trips FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      client_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
      OR driver_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
    )
  );

-- deliveries_select
DROP POLICY IF EXISTS "deliveries_select" ON public.deliveries;
CREATE POLICY "deliveries_select"
  ON public.deliveries FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      client_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
      OR driver_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
    )
  );

-- notifications_select
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
CREATE POLICY "notifications_select"
  ON public.notifications FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      recipient_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
      OR recipient_role = 'all'
      OR recipient_role IN (SELECT role FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
    )
  );

-- trajets_select
DROP POLICY IF EXISTS "trajets_select" ON public.trajets;
CREATE POLICY "trajets_select"
  ON public.trajets FOR SELECT
  USING (deleted_at IS NULL);

-- ============================================
-- 1d. Indexes manquants
-- ============================================
CREATE INDEX IF NOT EXISTS idx_trips_vehicle_id ON public.trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_vehicle_id ON public.deliveries(vehicle_id);
