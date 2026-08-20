-- Migration 041 — Retire les policies permissives du bucket `avatars`
--
-- CONSTAT
-- Le bucket `avatars` porte deux jeux de policies qui se superposent : celles
-- écrites par la migration 008, correctement cadrées sur le dossier de
-- l'utilisateur, et des policies auto-générées par le Dashboard Supabase
-- (suffixes `1oj01fe_0` / `1oj01fe_1`) qui ne filtrent que sur le bucket.
--
-- Les policies se combinant en OU, les permissives annulent les cadrées :
--
--   Users can upload avatars 1oj01fe_0   INSERT  with_check (bucket_id = 'avatars')
--   Users can upload their own avatar    INSERT  with_check … AND foldername[1] = sub
--
-- Résultat : n'importe quel utilisateur authentifié pouvait déposer ou
-- écraser un fichier dans le dossier de n'importe qui — remplacer l'avatar
-- d'un autre par une image arbitraire, par exemple. Même chose en UPDATE.
--
-- C'est le motif exact de la migration 040, cette fois dans storage.objects.
--
-- MÉTHODE
-- Vérifié avant suppression que chaque couple (bucket, commande) conserve un
-- remplaçant cadré : INSERT, UPDATE et DELETE sont couverts par les policies
-- de la 008, qui comparent `storage.foldername(name)[1]` au claim `sub`. Le
-- chemin d'upload est bien `{clerkId}/{timestamp}.{ext}`
-- (src/lib/supabaseAvatar.ts), donc ces policies correspondent au cas nominal.
--
-- La lecture publique du bucket est conservée : les avatars s'affichent dans
-- les listes de chauffeurs et d'hôtes avant toute authentification. On la
-- réécrit sous un nom explicite, à la place des deux SELECT auto-générés
-- redondants — dont l'un s'appelait « Users can update avatars » alors qu'il
-- s'agit d'un SELECT, ce qui rendait l'ensemble illisible.

-- ═══════════════════════════════════════════════════════════════════
-- Suppression des policies auto-générées
-- ═══════════════════════════════════════════════════════════════════

-- INSERT non cadré : dépôt dans le dossier de n'importe qui.
DROP POLICY IF EXISTS "Users can upload avatars 1oj01fe_0" ON storage.objects;

-- UPDATE non cadré : écrasement de l'avatar de n'importe qui.
DROP POLICY IF EXISTS "Users can update avatars 1oj01fe_0" ON storage.objects;

-- Deux SELECT redondants, dont un au nom trompeur.
DROP POLICY IF EXISTS "Users can update avatars 1oj01fe_1" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars 1oj01fe_0" ON storage.objects;

-- ═══════════════════════════════════════════════════════════════════
-- Lecture publique, sous un nom explicite
-- ═══════════════════════════════════════════════════════════════════

CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- ═══════════════════════════════════════════════════════════════════
-- Restent en place, inchangées (migration 008) — écriture cadrée :
--   Users can upload their own avatar   INSERT
--   Users can update their own avatar   UPDATE
--   Users can delete their own avatar   DELETE
-- toutes trois avec (storage.foldername(name))[1] = auth.jwt() ->> 'sub'
-- ═══════════════════════════════════════════════════════════════════

-- NON TRAITÉ ICI, VOLONTAIREMENT — bucket `hebergements`
--
-- Ses policies UPDATE et DELETE n'exigent qu'un utilisateur authentifié
-- (`auth.jwt() ->> 'sub' IS NOT NULL`), donc n'importe quel compte connecté
-- peut supprimer la photo d'un hébergement qui ne lui appartient pas.
--
-- Le cadrer briserait le parcours de création : les photos sont déposées
-- AVANT que la ligne `hebergements` existe, sous un identifiant temporaire
-- généré côté client (voir migration 039). Retirer une photo d'un brouillon
-- ne correspondrait alors à aucun hébergement et serait refusé.
--
-- La correction propre suppose de déposer d'abord dans un dossier au nom de
-- l'utilisateur puis de déplacer le fichier à la création — un refactor du
-- code mobile, pas une migration. À traiter après la mise en production.
