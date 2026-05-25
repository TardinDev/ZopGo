-- 023_profiles_multi_roles.sql
-- Multi-role MVP: a profile can now carry several roles simultaneously
-- (client, chauffeur, hebergeur). The legacy single `role` column is kept
-- for backwards compatibility — application code reads `roles` first and
-- falls back to `[role]` when the array is empty/null.
--
-- Policy decision: every existing user gains 'client' for free, because
-- "client" is the consumption mode (book rides, book accommodation) and
-- requires no skill verification. Chauffeurs/hebergeurs keep their
-- existing role on top.

-- 1. Add the multi-role array column with a safe default
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS roles text[] NOT NULL DEFAULT ARRAY['client']::text[];

-- 2. Backfill: union of {'client'} and the existing single role
-- e.g. a chauffeur becomes ['client', 'chauffeur'], a client stays ['client'].
UPDATE public.profiles
SET roles = ARRAY(SELECT DISTINCT unnest(ARRAY['client', role]))
WHERE roles = ARRAY['client']::text[]
  AND role IS NOT NULL;

-- 3. Constrain the array to known role values + non-empty
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_roles_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_roles_check
  CHECK (
    array_length(roles, 1) >= 1
    AND roles <@ ARRAY['client', 'chauffeur', 'hebergeur']::text[]
  );

-- 4. GIN index for `'chauffeur' = ANY(roles)` style filters
CREATE INDEX IF NOT EXISTS idx_profiles_roles_gin
  ON public.profiles USING gin (roles);

COMMENT ON COLUMN public.profiles.roles IS
  'Multi-role MVP (migration 023). App reads this first, falls back to legacy `role` if empty.';
