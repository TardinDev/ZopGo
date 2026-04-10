-- Migration 015 — Expand notification_preferences with hebergements + messages
--
-- Context: migration 005 created notification_preferences with only
-- {courses, trajets, promotions}. The app already references `hebergements`
-- in DEFAULT_PREFS (src/lib/supabaseNotifications.ts) and we are adding a
-- new `messages` category for direct_messages push notifications.
--
-- Strategy:
--   1. Update the column default so all NEW profiles get the 5 keys.
--   2. Backfill existing rows idempotently. The JSONB `||` operator makes
--      the RIGHT side overwrite the LEFT, so placing the defaults on the
--      LEFT and existing prefs on the RIGHT preserves any explicit user
--      choices while adding missing keys with their default value (true).

ALTER TABLE public.profiles
  ALTER COLUMN notification_preferences
  SET DEFAULT '{"courses":true,"trajets":true,"hebergements":true,"promotions":true,"messages":true}'::jsonb;

UPDATE public.profiles
SET notification_preferences =
  '{"courses":true,"trajets":true,"hebergements":true,"promotions":true,"messages":true}'::jsonb
  || COALESCE(notification_preferences, '{}'::jsonb)
WHERE
  notification_preferences IS NULL
  OR NOT (notification_preferences ? 'hebergements')
  OR NOT (notification_preferences ? 'messages');
