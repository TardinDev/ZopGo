-- ============================================
-- ZopGo — Avis par logement (034)
-- ============================================
-- Avis (note 1-5 + commentaire) attachés à un HÉBERGEMENT (distinct de la
-- note de l'hôte). Lecture publique (preuve sociale sur la fiche). Écriture
-- réservée à un client AYANT une réservation pour ce logement — la garde
-- est imposée par RLS (anti-faux-avis), pas seulement côté app. Un seul
-- avis par (logement, client) → upsert.

CREATE TABLE IF NOT EXISTS public.hebergement_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hebergement_id uuid NOT NULL REFERENCES public.hebergements(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (hebergement_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_heb_reviews_hebergement ON public.hebergement_reviews(hebergement_id);
CREATE INDEX IF NOT EXISTS idx_heb_reviews_client ON public.hebergement_reviews(client_id);

ALTER TABLE public.hebergement_reviews ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "hebergement_reviews_select" ON public.hebergement_reviews';
  EXECUTE 'DROP POLICY IF EXISTS "hebergement_reviews_insert" ON public.hebergement_reviews';
  EXECUTE 'DROP POLICY IF EXISTS "hebergement_reviews_update" ON public.hebergement_reviews';

  -- Lecture publique (preuve sociale).
  EXECUTE $POLICY$
    CREATE POLICY "hebergement_reviews_select"
      ON public.hebergement_reviews FOR SELECT
      USING (true)
  $POLICY$;

  -- Écriture : le client possède la ligne ET a une réservation pour ce
  -- logement.
  EXECUTE $POLICY$
    CREATE POLICY "hebergement_reviews_insert"
      ON public.hebergement_reviews FOR INSERT
      WITH CHECK (
        client_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
        AND EXISTS (
          SELECT 1 FROM public.hebergement_reservations hr
          WHERE hr.hebergement_id = hebergement_reviews.hebergement_id
            AND hr.client_id = hebergement_reviews.client_id
        )
      )
  $POLICY$;

  -- Mise à jour (upsert d'un avis existant) : mêmes garanties.
  EXECUTE $POLICY$
    CREATE POLICY "hebergement_reviews_update"
      ON public.hebergement_reviews FOR UPDATE
      USING (
        client_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
      )
      WITH CHECK (
        client_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
        AND EXISTS (
          SELECT 1 FROM public.hebergement_reservations hr
          WHERE hr.hebergement_id = hebergement_reviews.hebergement_id
            AND hr.client_id = hebergement_reviews.client_id
        )
      )
  $POLICY$;
END $$;
