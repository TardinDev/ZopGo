-- ============================================
-- ZopGo — Logements favoris (035)
-- ============================================
-- Permet à un client de mettre un hébergement en favori (❤️). Privé : un
-- client ne voit / ne modifie que SES favoris (RLS). Un favori unique par
-- (client, logement).

CREATE TABLE IF NOT EXISTS public.hebergement_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hebergement_id uuid NOT NULL REFERENCES public.hebergements(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, hebergement_id)
);

CREATE INDEX IF NOT EXISTS idx_heb_fav_client ON public.hebergement_favorites(client_id);
CREATE INDEX IF NOT EXISTS idx_heb_fav_hebergement ON public.hebergement_favorites(hebergement_id);

ALTER TABLE public.hebergement_favorites ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "hebergement_favorites_select" ON public.hebergement_favorites';
  EXECUTE 'DROP POLICY IF EXISTS "hebergement_favorites_insert" ON public.hebergement_favorites';
  EXECUTE 'DROP POLICY IF EXISTS "hebergement_favorites_delete" ON public.hebergement_favorites';

  -- Privé : le client ne voit que ses favoris.
  EXECUTE $POLICY$
    CREATE POLICY "hebergement_favorites_select"
      ON public.hebergement_favorites FOR SELECT
      USING (
        client_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
      )
  $POLICY$;

  EXECUTE $POLICY$
    CREATE POLICY "hebergement_favorites_insert"
      ON public.hebergement_favorites FOR INSERT
      WITH CHECK (
        client_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
      )
  $POLICY$;

  EXECUTE $POLICY$
    CREATE POLICY "hebergement_favorites_delete"
      ON public.hebergement_favorites FOR DELETE
      USING (
        client_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
      )
  $POLICY$;
END $$;
