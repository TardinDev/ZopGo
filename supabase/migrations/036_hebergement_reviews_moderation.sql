-- ============================================
-- ZopGo — Modération des avis logement (036)
-- ============================================
-- Donne à l'admin la capacité de MASQUER un avis abusif/faux (soft-delete,
-- réversible). Un avis masqué disparaît de l'app mobile pour tout le monde
-- (filtré par RLS — aucun changement de code mobile requis). Même schéma
-- que la modération des messages directs (030).

ALTER TABLE public.hebergement_reviews
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS hidden_by_admin boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_heb_reviews_deleted ON public.hebergement_reviews(deleted_at);

DO $$
BEGIN
  -- Lecture publique : on exclut désormais les avis masqués.
  EXECUTE 'DROP POLICY IF EXISTS "hebergement_reviews_select" ON public.hebergement_reviews';
  EXECUTE $POLICY$
    CREATE POLICY "hebergement_reviews_select"
      ON public.hebergement_reviews FOR SELECT
      USING (deleted_at IS NULL)
  $POLICY$;

  -- Admin : voit TOUS les avis (masqués compris) pour modérer.
  EXECUTE 'DROP POLICY IF EXISTS "admin_hebergement_reviews_select" ON public.hebergement_reviews';
  EXECUTE $POLICY$
    CREATE POLICY "admin_hebergement_reviews_select"
      ON public.hebergement_reviews FOR SELECT
      USING ((auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin'))
  $POLICY$;

  -- Admin : masquer / réafficher.
  EXECUTE 'DROP POLICY IF EXISTS "admin_hebergement_reviews_update" ON public.hebergement_reviews';
  EXECUTE $POLICY$
    CREATE POLICY "admin_hebergement_reviews_update"
      ON public.hebergement_reviews FOR UPDATE
      USING ((auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin'))
      WITH CHECK ((auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin'))
  $POLICY$;
END $$;
