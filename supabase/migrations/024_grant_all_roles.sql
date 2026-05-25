-- 024_grant_all_roles.sql
-- Product decision: every account can be client / chauffeur / hebergeur
-- simultaneously. Switching between them is a pure UI choice (handled by
-- the in-app mode switcher) and is not gated on verification. The role
-- picked at signup becomes the *initial* active role; the user can flip
-- to any of the other two whenever they want, without re-authenticating.
--
-- Backfills the new universe of granted roles for every existing profile
-- so the mode-switcher sheet always shows two switch options.

UPDATE public.profiles
SET roles = ARRAY['client', 'chauffeur', 'hebergeur']
WHERE roles IS NULL
   OR NOT (roles @> ARRAY['client', 'chauffeur', 'hebergeur']::text[]);

-- The 023 CHECK constraint already allows any subset of valid roles, so
-- no constraint change is needed. The GIN index also covers the new
-- larger arrays without modification.

COMMENT ON COLUMN public.profiles.roles IS
  'Granted roles (migration 024). Every account holds all three. Active role lives in `role`; multi-role is now the universal default.';
