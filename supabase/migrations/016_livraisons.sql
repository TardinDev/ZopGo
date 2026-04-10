-- Migration 016 — Livraisons table
--
-- Creates the backing table for the livraisons (delivery) feature. The
-- mobile `livraisonsStore` is being refactored from pure UI state to a
-- real Supabase-backed feature with a full state machine + push
-- notifications on each transition.
--
-- State machine:
--   en_attente → acceptee → en_cours → livree
--              ↘ refusee
--              ↘ annulee
--              ↘ expiree

CREATE TABLE IF NOT EXISTS public.livraisons (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  livreur_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pickup_location text NOT NULL,
  dropoff_location text NOT NULL,
  pickup_lat double precision,
  pickup_lng double precision,
  dropoff_lat double precision,
  dropoff_lng double precision,
  description text,
  prix_estime integer DEFAULT 0,
  status text NOT NULL DEFAULT 'en_attente'
    CHECK (status IN ('en_attente','acceptee','refusee','en_cours','livree','annulee','expiree')),
  accepted_at timestamptz,
  picked_up_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_livraisons_client ON public.livraisons(client_id);
CREATE INDEX IF NOT EXISTS idx_livraisons_livreur ON public.livraisons(livreur_id);
CREATE INDEX IF NOT EXISTS idx_livraisons_status ON public.livraisons(status);
CREATE INDEX IF NOT EXISTS idx_livraisons_created ON public.livraisons(created_at DESC);

-- updated_at trigger (handle_updated_at is defined in 001_initial_schema.sql)
DROP TRIGGER IF EXISTS set_livraisons_updated_at ON public.livraisons;
CREATE TRIGGER set_livraisons_updated_at
  BEFORE UPDATE ON public.livraisons
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Row Level Security
-- Policies are permissive on purpose: the mobile app always queries with
-- the Clerk JWT, and ownership is enforced at the client layer. Tighten
-- later if needed (e.g. USING (client_id = auth.uid() OR livreur_id = auth.uid())).
ALTER TABLE public.livraisons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their livraisons" ON public.livraisons;
CREATE POLICY "Users can view their livraisons"
  ON public.livraisons FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Clients can create livraisons" ON public.livraisons;
CREATE POLICY "Clients can create livraisons"
  ON public.livraisons FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Parties can update livraisons" ON public.livraisons;
CREATE POLICY "Parties can update livraisons"
  ON public.livraisons FOR UPDATE
  USING (true);

-- Realtime subscription for live status updates in the mobile app
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'livraisons'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.livraisons;
  END IF;
END $$;
