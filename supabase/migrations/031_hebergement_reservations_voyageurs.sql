-- ============================================
-- ZopGo — Nombre de voyageurs sur les réservations d'hébergement (031)
-- ============================================
-- La capacité d'un logement (hebergements.capacite) était affichée mais
-- jamais utilisée : la réservation ne stockait que le nombre de nuits.
-- On ajoute le nombre de voyageurs choisi par le client (borné côté app
-- par la capacité), pour que l'hébergeur sache combien de personnes
-- viennent.

ALTER TABLE public.hebergement_reservations
  ADD COLUMN IF NOT EXISTS nombre_voyageurs integer NOT NULL DEFAULT 1;

-- Garde-fou : au moins 1 voyageur.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'hebergement_reservations_nombre_voyageurs_check'
  ) THEN
    ALTER TABLE public.hebergement_reservations
      ADD CONSTRAINT hebergement_reservations_nombre_voyageurs_check
      CHECK (nombre_voyageurs >= 1);
  END IF;
END $$;
