-- 038: colonnes address + emergency_contact manquantes sur profiles
--
-- Le code mobile (upsertProfile / updateProfile, commit 23c792a du 2 avril)
-- envoie `address` et `emergency_contact` alors qu'aucune migration ne les a
-- jamais créées. Résultat : PostgREST rejette chaque INSERT avec PGRST204
-- ("Could not find the 'address' column of 'profiles' in the schema cache"),
-- donc AUCUN profil n'a été créé depuis le 31 mars. Les nouveaux inscrits
-- restent bloqués avec "Ton profil n'est pas encore synchronisé avec la
-- base" sur toutes les réservations — le retry ajouté en 95bebb1 ne peut
-- pas aider puisque l'échec est déterministe.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS address text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS emergency_contact text NOT NULL DEFAULT '';
