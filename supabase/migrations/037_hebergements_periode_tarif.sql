-- ============================================
-- ZopGo — Période de tarification des hébergements (037)
-- ============================================
-- Jusqu'ici un hébergement avait un prix forcément « par nuit ». L'hôte peut
-- désormais choisir d'être payé à la nuit, à la semaine ou au mois. On ajoute
-- la période ; la colonne `prix_par_nuit` reste le MONTANT (désormais « prix
-- pour la période choisie » — non renommée pour rester rétro-compatible).
--
-- Les annonces existantes prennent 'nuit' par défaut : aucun changement de
-- comportement pour elles.

ALTER TABLE public.hebergements
  ADD COLUMN IF NOT EXISTS periode_tarif text NOT NULL DEFAULT 'nuit';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'hebergements_periode_tarif_check'
  ) THEN
    ALTER TABLE public.hebergements
      ADD CONSTRAINT hebergements_periode_tarif_check
      CHECK (periode_tarif IN ('nuit', 'semaine', 'mois'));
  END IF;
END $$;
