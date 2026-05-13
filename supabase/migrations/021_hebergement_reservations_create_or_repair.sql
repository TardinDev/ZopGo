-- ============================================
-- ZopGo - Create or repair hebergement_reservations
-- ============================================
-- Migration 014 is marked applied in this project's
-- supabase_migrations.schema_migrations history, but the table itself
-- doesn't exist (probed via REST API: 404). Most likely root cause is
-- the 51857fd hot-fix to 014 (gen_random_uuid + non-immutable index
-- predicate) — the earlier broken version got marked applied even
-- though it transactionally rolled back.
--
-- Rather than `migration repair --status reverted 014` (which mutates
-- history opaquely), this is a forward-only migration that idempotently
-- creates the table, indexes, RLS (with the corrected Clerk-JWT mapping
-- — the original used auth.uid() which is null under TPA), and the
-- updated_at trigger. Safe to re-run.
-- ============================================

CREATE TABLE IF NOT EXISTS public.hebergement_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hebergement_id UUID NOT NULL REFERENCES public.hebergements(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hebergeur_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nombre_nuits INTEGER NOT NULL DEFAULT 1,
  prix_total INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'acceptee', 'refusee', 'annulee')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_heb_res_client ON public.hebergement_reservations(client_id);
CREATE INDEX IF NOT EXISTS idx_heb_res_hebergeur ON public.hebergement_reservations(hebergeur_id);
CREATE INDEX IF NOT EXISTS idx_heb_res_hebergement ON public.hebergement_reservations(hebergement_id);

ALTER TABLE public.hebergement_reservations ENABLE ROW LEVEL SECURITY;

-- Drop any pre-existing policies (old names from 014 with auth.uid(), and
-- the names we'll use here) so the migration is replay-safe.
DROP POLICY IF EXISTS "client_select_own_heb_reservations" ON public.hebergement_reservations;
DROP POLICY IF EXISTS "hebergeur_select_own_heb_reservations" ON public.hebergement_reservations;
DROP POLICY IF EXISTS "client_insert_heb_reservation" ON public.hebergement_reservations;
DROP POLICY IF EXISTS "hebergeur_update_heb_reservation_status" ON public.hebergement_reservations;
DROP POLICY IF EXISTS "hebergement_reservations_select" ON public.hebergement_reservations;
DROP POLICY IF EXISTS "hebergement_reservations_insert" ON public.hebergement_reservations;
DROP POLICY IF EXISTS "hebergement_reservations_update" ON public.hebergement_reservations;

CREATE POLICY "hebergement_reservations_select"
  ON public.hebergement_reservations FOR SELECT
  USING (
    client_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
    OR hebergeur_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
  );

CREATE POLICY "hebergement_reservations_insert"
  ON public.hebergement_reservations FOR INSERT
  WITH CHECK (
    client_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
  );

CREATE POLICY "hebergement_reservations_update"
  ON public.hebergement_reservations FOR UPDATE
  USING (
    client_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
    OR hebergeur_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
  )
  WITH CHECK (
    client_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
    OR hebergeur_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
  );

-- Trigger updated_at — uses CREATE OR REPLACE so the function is replay-safe.
CREATE OR REPLACE FUNCTION public.update_heb_reservation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_heb_reservation_updated_at ON public.hebergement_reservations;
CREATE TRIGGER trigger_heb_reservation_updated_at
  BEFORE UPDATE ON public.hebergement_reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_heb_reservation_updated_at();

-- Add to Realtime publication if not already there.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'hebergement_reservations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.hebergement_reservations;
  END IF;
END $$;
