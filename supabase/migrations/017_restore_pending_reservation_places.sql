-- 017_restore_pending_reservation_places.sql
--
-- Bug fix data cleanup.
--
-- Avant ce fix, le store reservationsStore.bookTrajet décrémentait
-- immédiatement places_disponibles dès la création d'une réservation,
-- AVANT que le chauffeur ne l'accepte. Conséquence : si les places
-- atteignaient 0 à cause de demandes en attente, le trajet basculait
-- prématurément en status 'complet' et disparaissait de la liste voyages
-- côté client.
--
-- Le code applicatif a été corrigé : la décrémentation se fait désormais
-- uniquement à l'acceptation par le chauffeur (via decrementTrajetPlaces).
--
-- Cette migration restaure les places "volées" par les réservations
-- encore en 'en_attente' (jamais acceptées), et rebascule le trajet en
-- 'en_attente' si des places redeviennent disponibles.
--
-- Les trajets en 'effectue' sont préservés tels quels.

-- Vérification (à exécuter manuellement avant le UPDATE pour voir l'impact) :
-- SELECT
--   t.id, t.ville_depart, t.ville_arrivee,
--   t.places_disponibles AS current_places,
--   SUM(r.nombre_places) AS to_restore,
--   t.places_disponibles + SUM(r.nombre_places) AS new_places,
--   t.status AS current_status
-- FROM public.trajets t
-- JOIN public.reservations r
--   ON r.trajet_id = t.id AND r.status = 'en_attente'
-- WHERE t.deleted_at IS NULL AND t.status <> 'effectue'
-- GROUP BY t.id, t.ville_depart, t.ville_arrivee, t.places_disponibles, t.status;

WITH pending_places AS (
  SELECT trajet_id, SUM(nombre_places)::int AS to_restore
  FROM public.reservations
  WHERE status = 'en_attente'
  GROUP BY trajet_id
)
UPDATE public.trajets t
SET
  places_disponibles = t.places_disponibles + pp.to_restore,
  status = CASE
    WHEN (t.places_disponibles + pp.to_restore) > 0 AND t.status = 'complet'
      THEN 'en_attente'
    ELSE t.status
  END
FROM pending_places pp
WHERE t.id = pp.trajet_id
  AND t.deleted_at IS NULL
  AND t.status <> 'effectue';
