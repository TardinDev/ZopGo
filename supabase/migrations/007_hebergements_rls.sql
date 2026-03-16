-- ============================================
-- ZopGo - Hébergements table + RLS + fix role constraints
-- ============================================
-- Corrige :
--   1. Contrainte role sur profiles (ajoute 'hebergeur')
--   2. Contrainte recipient_role sur notifications (ajoute 'hebergeur')
--   3. Crée la table hebergements manquante
--   4. Active RLS + policies pour hebergements
--   5. Ajoute les admin policies pour hebergements
-- ============================================

-- ============================================
-- 1. Fix profiles.role constraint — ajouter 'hebergeur'
-- ============================================
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('client', 'chauffeur', 'hebergeur'));

-- ============================================
-- 2. Fix notifications.recipient_role constraint — ajouter 'hebergeur'
-- ============================================
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_recipient_role_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_recipient_role_check
  CHECK (recipient_role IN ('client', 'chauffeur', 'hebergeur', 'all'));

-- ============================================
-- 3. Créer la table hebergements
-- ============================================
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

-- Index
CREATE INDEX IF NOT EXISTS idx_hebergements_hebergeur ON public.hebergements(hebergeur_id);
CREATE INDEX IF NOT EXISTS idx_hebergements_status ON public.hebergements(status);
CREATE INDEX IF NOT EXISTS idx_hebergements_created ON public.hebergements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hebergements_active ON public.hebergements(hebergeur_id) WHERE deleted_at IS NULL;

-- Trigger updated_at
CREATE TRIGGER set_hebergements_updated_at
  BEFORE UPDATE ON public.hebergements
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Audit trigger
CREATE TRIGGER audit_hebergements
  AFTER INSERT OR UPDATE OR DELETE ON public.hebergements
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- ============================================
-- 4. Activer RLS + Policies pour hebergements
-- ============================================
ALTER TABLE public.hebergements ENABLE ROW LEVEL SECURITY;

-- SELECT : lecture publique (les clients voient les hébergements disponibles)
-- Filtre les soft-deleted
CREATE POLICY "hebergements_select"
  ON public.hebergements FOR SELECT
  USING (deleted_at IS NULL);

-- INSERT : uniquement l'hébergeur propriétaire
CREATE POLICY "hebergements_insert"
  ON public.hebergements FOR INSERT
  WITH CHECK (
    hebergeur_id IN (
      SELECT id FROM public.profiles
      WHERE clerk_id = (auth.jwt() ->> 'sub')
    )
  );

-- UPDATE : uniquement l'hébergeur propriétaire
CREATE POLICY "hebergements_update"
  ON public.hebergements FOR UPDATE
  USING (
    hebergeur_id IN (
      SELECT id FROM public.profiles
      WHERE clerk_id = (auth.jwt() ->> 'sub')
    )
  )
  WITH CHECK (
    hebergeur_id IN (
      SELECT id FROM public.profiles
      WHERE clerk_id = (auth.jwt() ->> 'sub')
    )
  );

-- DELETE : uniquement l'hébergeur propriétaire
CREATE POLICY "hebergements_delete"
  ON public.hebergements FOR DELETE
  USING (
    hebergeur_id IN (
      SELECT id FROM public.profiles
      WHERE clerk_id = (auth.jwt() ->> 'sub')
    )
  );

-- ============================================
-- 5. Admin policies pour hebergements
-- ============================================
CREATE POLICY "admin_hebergements_select"
  ON public.hebergements FOR SELECT
  USING (
    (auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin')
  );

CREATE POLICY "admin_hebergements_update"
  ON public.hebergements FOR UPDATE
  USING (
    (auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin')
  )
  WITH CHECK (
    (auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin')
  );
