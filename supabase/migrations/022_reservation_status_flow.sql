-- ============================================
-- ZopGo - Reservation status flow expansion
-- ============================================
-- Extends reservations.status with the chauffeur-driven workflow used by the
-- new "Course en cours" UI: once the chauffeur accepts, they advance the
-- reservation through 'en_route' (parti) -> 'arrivee' (déposé le client) ->
-- 'terminee' (course finalisée). A separate 'expiree' status is set by the
-- mobile client when an 'en_attente' reservation sits idle for >5 min.
--
-- Idempotent: drops the old constraint before re-adding the wider one. Also
-- adds two helper timestamps so we can render "since when" labels on the
-- chauffeur dashboard without fetching the audit table.
-- ============================================

ALTER TABLE public.reservations
  DROP CONSTRAINT IF EXISTS reservations_status_check;

ALTER TABLE public.reservations
  ADD CONSTRAINT reservations_status_check
  CHECK (status IN (
    'en_attente',
    'acceptee',
    'refusee',
    'annulee',
    'en_route',
    'arrivee',
    'terminee',
    'expiree'
  ));

-- Track when the chauffeur transitions to each state so the client can show
-- "Parti il y a 12 min" without joining notifications/audit history.
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- A boolean shortcut so we don't re-prompt the client to review a course they
-- already rated. RatingModal flips this to true on submit.
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS reviewed BOOLEAN NOT NULL DEFAULT FALSE;

-- Index to make the auto-expire query cheap.
CREATE INDEX IF NOT EXISTS idx_reservations_status_created
  ON public.reservations(status, created_at);
