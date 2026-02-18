-- 005: Push notification support
-- Adds push token and notification preferences to profiles

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token text;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_preferences jsonb
  NOT NULL DEFAULT '{"courses":true,"trajets":true,"promotions":true}';

-- Index for quickly finding profiles with a push token (for sending notifications)
CREATE INDEX IF NOT EXISTS idx_profiles_push_token
  ON profiles (push_token)
  WHERE push_token IS NOT NULL AND deleted_at IS NULL;
