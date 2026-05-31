-- ============================================
-- ZopGo — Dates de séjour des réservations d'hébergement (033)
-- ============================================
-- Jusqu'ici la réservation ne stockait que `nombre_nuits` : l'hôte ne
-- savait pas QUAND le client venait. On ajoute les dates réelles
-- d'arrivée et de départ (check-in / check-out). Le nombre de nuits reste
-- la durée ; date_depart = date_arrivee + nombre_nuits.
--
-- NB : la disponibilité reste un simple compteur d'unités (décrémenté à
-- l'acceptation) — ces colonnes ajoutent l'INFORMATION des dates, pas un
-- moteur de calendrier anti-chevauchement (hors scope).
--
-- Nullable : les réservations existantes gardent NULL.

ALTER TABLE public.hebergement_reservations
  ADD COLUMN IF NOT EXISTS date_arrivee date,
  ADD COLUMN IF NOT EXISTS date_depart date;
