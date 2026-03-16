-- ============================================
-- ZopGo — Script complet : migrations 004 → 007
-- ============================================
-- A exécuter dans le SQL Editor de Supabase
-- Idempotent : safe à relancer plusieurs fois
-- ============================================


-- ############################################
-- MIGRATION 004 : Security Hardening
-- ############################################

-- 4.1 Extension pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 4.2 Table audit_log immutable
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

-- Policies audit_log (INSERT seul = immutable)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'audit_log_insert' AND tablename = 'audit_log') THEN
    CREATE POLICY "audit_log_insert" ON public.audit_log FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'audit_log_select' AND tablename = 'audit_log') THEN
    CREATE POLICY "audit_log_select" ON public.audit_log FOR SELECT USING (true);
  END IF;
END $$;

-- 4.3 Fonction audit_trigger
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

-- 4.4 Attacher audit triggers aux tables existantes
DROP TRIGGER IF EXISTS audit_profiles ON public.profiles;
CREATE TRIGGER audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

DROP TRIGGER IF EXISTS audit_trips ON public.trips;
CREATE TRIGGER audit_trips
  AFTER INSERT OR UPDATE OR DELETE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

DROP TRIGGER IF EXISTS audit_deliveries ON public.deliveries;
CREATE TRIGGER audit_deliveries
  AFTER INSERT OR UPDATE OR DELETE ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

DROP TRIGGER IF EXISTS audit_trajets ON public.trajets;
CREATE TRIGGER audit_trajets
  AFTER INSERT OR UPDATE OR DELETE ON public.trajets
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

DROP TRIGGER IF EXISTS audit_notifications ON public.notifications;
CREATE TRIGGER audit_notifications
  AFTER INSERT OR UPDATE OR DELETE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- 4.5 Soft delete — colonnes deleted_at
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.trajets ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- 4.6 Partial indexes pour lignes non supprimées
CREATE INDEX IF NOT EXISTS idx_profiles_active ON public.profiles(clerk_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_vehicles_active ON public.vehicles(owner_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_trips_active ON public.trips(status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_deliveries_active ON public.deliveries(status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_active ON public.notifications(recipient_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_trajets_active ON public.trajets(chauffeur_id) WHERE deleted_at IS NULL;

-- 4.7 Mettre à jour les RLS SELECT pour filtrer deleted_at IS NULL
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT
  USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "vehicles_select" ON public.vehicles;
CREATE POLICY "vehicles_select"
  ON public.vehicles FOR SELECT
  USING (deleted_at IS NULL);

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

DROP POLICY IF EXISTS "trajets_select" ON public.trajets;
CREATE POLICY "trajets_select"
  ON public.trajets FOR SELECT
  USING (deleted_at IS NULL);

-- 4.8 Indexes manquants
CREATE INDEX IF NOT EXISTS idx_trips_vehicle_id ON public.trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_vehicle_id ON public.deliveries(vehicle_id);


-- ############################################
-- MIGRATION 005 : Push Notifications
-- ############################################

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS push_token text;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_preferences jsonb
  NOT NULL DEFAULT '{"courses":true,"trajets":true,"promotions":true}';

CREATE INDEX IF NOT EXISTS idx_profiles_push_token
  ON public.profiles (push_token)
  WHERE push_token IS NOT NULL AND deleted_at IS NULL;


-- ############################################
-- MIGRATION 006 : Admin RLS Policies
-- ############################################

-- Admin policies — PROFILES
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_profiles_select' AND tablename = 'profiles') THEN
    CREATE POLICY "admin_profiles_select" ON public.profiles FOR SELECT
      USING ((auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_profiles_update' AND tablename = 'profiles') THEN
    CREATE POLICY "admin_profiles_update" ON public.profiles FOR UPDATE
      USING ((auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin'))
      WITH CHECK ((auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin'));
  END IF;
END $$;

-- Admin policies — VEHICLES
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_vehicles_select' AND tablename = 'vehicles') THEN
    CREATE POLICY "admin_vehicles_select" ON public.vehicles FOR SELECT
      USING ((auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_vehicles_update' AND tablename = 'vehicles') THEN
    CREATE POLICY "admin_vehicles_update" ON public.vehicles FOR UPDATE
      USING ((auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin'))
      WITH CHECK ((auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin'));
  END IF;
END $$;

-- Admin policies — TRIPS
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_trips_select' AND tablename = 'trips') THEN
    CREATE POLICY "admin_trips_select" ON public.trips FOR SELECT
      USING ((auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_trips_update' AND tablename = 'trips') THEN
    CREATE POLICY "admin_trips_update" ON public.trips FOR UPDATE
      USING ((auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin'))
      WITH CHECK ((auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin'));
  END IF;
END $$;

-- Admin policies — DELIVERIES
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_deliveries_select' AND tablename = 'deliveries') THEN
    CREATE POLICY "admin_deliveries_select" ON public.deliveries FOR SELECT
      USING ((auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_deliveries_update' AND tablename = 'deliveries') THEN
    CREATE POLICY "admin_deliveries_update" ON public.deliveries FOR UPDATE
      USING ((auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin'))
      WITH CHECK ((auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin'));
  END IF;
END $$;

-- Admin policies — TRAJETS
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_trajets_select' AND tablename = 'trajets') THEN
    CREATE POLICY "admin_trajets_select" ON public.trajets FOR SELECT
      USING ((auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_trajets_update' AND tablename = 'trajets') THEN
    CREATE POLICY "admin_trajets_update" ON public.trajets FOR UPDATE
      USING ((auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin'))
      WITH CHECK ((auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin'));
  END IF;
END $$;

-- Admin policies — NOTIFICATIONS
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_notifications_select' AND tablename = 'notifications') THEN
    CREATE POLICY "admin_notifications_select" ON public.notifications FOR SELECT
      USING ((auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_notifications_update' AND tablename = 'notifications') THEN
    CREATE POLICY "admin_notifications_update" ON public.notifications FOR UPDATE
      USING ((auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin'))
      WITH CHECK ((auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin'));
  END IF;
END $$;

-- Admin policies — AUDIT LOG
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_audit_log_select' AND tablename = 'audit_log') THEN
    CREATE POLICY "admin_audit_log_select" ON public.audit_log FOR SELECT
      USING ((auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin'));
  END IF;
END $$;


-- ############################################
-- MIGRATION 007 : Hébergements + fix role constraints
-- ############################################

-- 7.1 Fix profiles.role constraint — ajouter 'hebergeur'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('client', 'chauffeur', 'hebergeur'));

-- 7.2 Fix notifications.recipient_role constraint — ajouter 'hebergeur'
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_recipient_role_check;
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_recipient_role_check
  CHECK (recipient_role IN ('client', 'chauffeur', 'hebergeur', 'all'));

-- 7.3 Créer la table hebergements
CREATE TABLE IF NOT EXISTS public.hebergements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  hebergeur_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nom text NOT NULL,
  type text NOT NULL CHECK (type IN ('hotel', 'auberge', 'appartement', 'maison', 'chambre')),
  ville text NOT NULL,
  adresse text NOT NULL DEFAULT '',
  prix_par_nuit integer NOT NULL DEFAULT 0,
  capacite integer NOT NULL DEFAULT 1,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'actif' CHECK (status IN ('actif', 'inactif')),
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hebergements_hebergeur ON public.hebergements(hebergeur_id);
CREATE INDEX IF NOT EXISTS idx_hebergements_status ON public.hebergements(status);
CREATE INDEX IF NOT EXISTS idx_hebergements_created ON public.hebergements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hebergements_active ON public.hebergements(hebergeur_id) WHERE deleted_at IS NULL;

-- Trigger updated_at
DROP TRIGGER IF EXISTS set_hebergements_updated_at ON public.hebergements;
CREATE TRIGGER set_hebergements_updated_at
  BEFORE UPDATE ON public.hebergements
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Audit trigger
DROP TRIGGER IF EXISTS audit_hebergements ON public.hebergements;
CREATE TRIGGER audit_hebergements
  AFTER INSERT OR UPDATE OR DELETE ON public.hebergements
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- 7.4 RLS hebergements
ALTER TABLE public.hebergements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hebergements_select" ON public.hebergements;
CREATE POLICY "hebergements_select"
  ON public.hebergements FOR SELECT
  USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "hebergements_insert" ON public.hebergements;
CREATE POLICY "hebergements_insert"
  ON public.hebergements FOR INSERT
  WITH CHECK (
    hebergeur_id IN (
      SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub')
    )
  );

DROP POLICY IF EXISTS "hebergements_update" ON public.hebergements;
CREATE POLICY "hebergements_update"
  ON public.hebergements FOR UPDATE
  USING (
    hebergeur_id IN (
      SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub')
    )
  )
  WITH CHECK (
    hebergeur_id IN (
      SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub')
    )
  );

DROP POLICY IF EXISTS "hebergements_delete" ON public.hebergements;
CREATE POLICY "hebergements_delete"
  ON public.hebergements FOR DELETE
  USING (
    hebergeur_id IN (
      SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub')
    )
  );

-- 7.5 Admin policies hebergements
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_hebergements_select' AND tablename = 'hebergements') THEN
    CREATE POLICY "admin_hebergements_select" ON public.hebergements FOR SELECT
      USING ((auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_hebergements_update' AND tablename = 'hebergements') THEN
    CREATE POLICY "admin_hebergements_update" ON public.hebergements FOR UPDATE
      USING ((auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin'))
      WITH CHECK ((auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin'));
  END IF;
END $$;


-- ============================================
-- DONE! Vérifie avec :
--   SELECT tablename, policyname FROM pg_policies ORDER BY tablename;
-- ============================================
