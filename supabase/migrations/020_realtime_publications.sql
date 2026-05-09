-- ============================================
-- ZopGo - Realtime publications
-- ============================================
-- Adds the missing public tables to the supabase_realtime publication so
-- the mobile app can subscribe to INSERT/UPDATE/DELETE events instead of
-- polling on a 15-30 s interval (battery + cellular data hog on the
-- ground in Gabon). Idempotent: every block checks pg_publication_tables
-- before ALTER.
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'trajets'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.trajets;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'hebergements'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.hebergements;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'direct_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'reservations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'hebergement_reservations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.hebergement_reservations;
  END IF;
END $$;
