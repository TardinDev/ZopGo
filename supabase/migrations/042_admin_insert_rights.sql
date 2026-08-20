-- Migration 042 — Droit d'insertion pour l'administration
--
-- CONSTAT
-- La migration 006 a doté l'admin de policies `admin_*_select` et
-- `admin_*_update`, mais d'aucune policy d'insertion. L'administration ne
-- peut donc rien créer : ni trajet, ni hébergement, ni profil.
--
-- Le blocage s'est durci avec la migration 040, qui a cadré les insertions
-- sur le propriétaire :
--
--   trajets_insert  WITH CHECK chauffeur_id IN (
--     SELECT id FROM profiles WHERE clerk_id = auth.jwt() ->> 'sub')
--
-- Un administrateur créant un trajet pour un chauffeur tiers est donc rejeté,
-- puisque le trajet n'est pas le sien. C'est le comportement voulu pour un
-- utilisateur ordinaire, et exactement ce qu'il faut lever pour l'admin.
--
-- Ces policies s'ajoutent aux policies cadrées, sans les remplacer : les
-- règles se combinant en OU, un utilisateur ordinaire reste soumis au cadrage
-- par propriétaire, et seul un porteur du claim `admin_role` y échappe.
--
-- SUPPRESSION — rien à ajouter ici
-- `admin_*_update` est inconditionnelle pour un admin, en USING comme en
-- WITH CHECK. Poser `deleted_at` est donc déjà possible, et c'est ainsi que
-- ce projet supprime : en soft-delete, les policies de lecture filtrant sur
-- `deleted_at IS NULL`. Aucune policy DELETE n'est accordée — un effacement
-- physique serait irréversible et priverait l'audit de toute trace.

-- ═══════════════════════════════════════════════════════════════════
-- TRAJETS
-- ═══════════════════════════════════════════════════════════════════

CREATE POLICY "admin_trajets_insert"
  ON public.trajets FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin'));

-- ═══════════════════════════════════════════════════════════════════
-- HEBERGEMENTS
-- ═══════════════════════════════════════════════════════════════════

CREATE POLICY "admin_hebergements_insert"
  ON public.hebergements FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin'));

-- ═══════════════════════════════════════════════════════════════════
-- PROFILES
-- ═══════════════════════════════════════════════════════════════════
--
-- Permet de créer la ligne de profil d'un chauffeur ou d'un hébergeur depuis
-- l'administration. À noter : cela ne crée PAS le compte d'authentification.
-- Un profil sans utilisateur Clerk correspondant ne peut pas se connecter —
-- la création du compte exige la clé secrète Clerk, qui ne doit jamais se
-- trouver dans un navigateur, et passera donc par une Edge Function dédiée.

CREATE POLICY "admin_profiles_insert"
  ON public.profiles FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin'));
