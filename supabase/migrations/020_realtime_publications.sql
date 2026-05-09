-- ============================================
-- ZopGo - Realtime publications
-- ============================================
-- Adds the missing public tables to the supabase_realtime publication so
-- the mobile app can subscribe to INSERT/UPDATE/DELETE events instead of
-- polling on a 15-30 s interval (battery + cellular data hog on the
-- ground in Gabon). Idempotent: every block checks pg_publication_tables
-- before ALTER, and skips silently if the source table doesn't yet exist
-- (the matching CREATE TABLE migration will publish it itself when run).
-- ============================================

DO $$
BEGIN
  -- trajets (created in 002_notifications_trajets.sql)
  IF to_regclass('public.trajets') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'trajets'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.trajets;
  END IF;

  -- hebergements (created in 007_hebergements_rls.sql)
  IF to_regclass('public.hebergements') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'hebergements'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.hebergements;
  END IF;

  -- notifications (created in 002_notifications_trajets.sql)
  IF to_regclass('public.notifications') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'notifications'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;

  -- direct_messages (created in 013_direct_messages.sql)
  IF to_regclass('public.direct_messages') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'direct_messages'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
  END IF;

  -- reservations (created in 012_reservations.sql)
  IF to_regclass('public.reservations') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'reservations'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
  END IF;

  -- hebergement_reservations (created in 014_hebergement_reservations.sql)
  IF to_regclass('public.hebergement_reservations') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'hebergement_reservations'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.hebergement_reservations;
  END IF;
END $$;
