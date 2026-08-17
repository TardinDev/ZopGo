-- Migration 040 — Supprime les policies RLS permissives héritées de 001/002
--
-- CONSTAT
-- Vingt policies créées par les migrations 001 et 002 utilisent `USING (true)`
-- ou `WITH CHECK (true)`. La migration 003 était écrite pour les supprimer
-- (`drop policy if exists`, lignes 16, 21, 40) mais elles sont toujours
-- présentes en production : le DROP n'a jamais pris effet.
--
-- Les policies RLS se combinent en OU. Ces reliquats annulent donc
-- intégralement les policies cadrées créées par 003, 004 et 006. Tout le
-- durcissement était sans effet depuis l'origine.
--
-- Constaté en production avec la seule clé anon — celle qui est embarquée
-- dans l'APK publié, donc publique de fait :
--   • notifications : 41 lignes lisibles, incluant des noms d'utilisateurs et
--     leur activité (« X souhaite réserver 2 places pour votre trajet »)
--   • audit_log     : 677 lignes lisibles, avec old_data/new_data des profils
--   • profiles      : les lignes soft-deleted restaient visibles, ce qui vidait
--     de son sens la suppression de compte (exigée par Google Play)
--   • profiles UPDATE / trajets UPDATE+DELETE / vehicles ALL en `true` :
--     n'importe qui pouvait modifier les données d'autrui, y compris
--     réécrire le push_token d'un autre utilisateur
--
-- MÉTHODE
-- Les noms de ces policies promettent un cadrage (« own profile », « their
-- trajets ») que leur prédicat ne fait pas. On les supprime, mais un DROP seul
-- casserait l'application : pour six couples table/commande il n'existe aucun
-- remplaçant, et pour les UPDATE il ne resterait que la policy admin — ce qui
-- bloquerait l'inscription, l'édition de profil, l'enregistrement du
-- push_token et la gestion des trajets. Chaque suppression est donc appariée
-- à une policy cadrée, sur le modèle déjà utilisé par 003/004 :
--   <colonne>_id IN (SELECT id FROM profiles WHERE clerk_id = auth.jwt()->>'sub')
--
-- Restent volontairement en lecture publique : profiles, trajets et vehicles
-- (filtrés sur deleted_at IS NULL). L'application en dépend pour lister les
-- chauffeurs et les trajets disponibles avant toute réservation.

-- ═══════════════════════════════════════════════════════════════════
-- PROFILES
-- ═══════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- profiles_select (deleted_at IS NULL) existe déjà et redevient effective.

CREATE POLICY "profiles_insert"
  ON public.profiles FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'sub') = clerk_id);

-- Couvre l'upsert de setupProfile ET updatePushToken.
CREATE POLICY "profiles_update"
  ON public.profiles FOR UPDATE
  USING ((auth.jwt() ->> 'sub') = clerk_id)
  WITH CHECK ((auth.jwt() ->> 'sub') = clerk_id);

-- ═══════════════════════════════════════════════════════════════════
-- NOTIFICATIONS
-- ═══════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;

-- notifications_select et notifications_insert existent déjà et sont cadrées.

-- Marquer comme lue : uniquement ses propres notifications.
CREATE POLICY "notifications_update"
  ON public.notifications FOR UPDATE
  USING (
    recipient_id IN (
      SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub')
    )
  )
  WITH CHECK (
    recipient_id IN (
      SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub')
    )
  );

-- ═══════════════════════════════════════════════════════════════════
-- TRAJETS
-- ═══════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Trajets are viewable by everyone" ON public.trajets;
DROP POLICY IF EXISTS "Chauffeurs can create trajets" ON public.trajets;
DROP POLICY IF EXISTS "Chauffeurs can update their trajets" ON public.trajets;
DROP POLICY IF EXISTS "Chauffeurs can delete their trajets" ON public.trajets;

-- trajets_select (deleted_at IS NULL) reste : la découverte des trajets par
-- les clients est publique par conception.

CREATE POLICY "trajets_insert"
  ON public.trajets FOR INSERT
  WITH CHECK (
    chauffeur_id IN (
      SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub')
    )
  );

CREATE POLICY "trajets_update"
  ON public.trajets FOR UPDATE
  USING (
    chauffeur_id IN (
      SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub')
    )
  )
  WITH CHECK (
    chauffeur_id IN (
      SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub')
    )
  );

CREATE POLICY "trajets_delete"
  ON public.trajets FOR DELETE
  USING (
    chauffeur_id IN (
      SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub')
    )
  );

-- ═══════════════════════════════════════════════════════════════════
-- TRIPS (legacy ZopRide)
-- ═══════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view their trips" ON public.trips;
DROP POLICY IF EXISTS "Users can create trips" ON public.trips;
DROP POLICY IF EXISTS "Users can update their trips" ON public.trips;

CREATE POLICY "trips_insert"
  ON public.trips FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub')
    )
  );

CREATE POLICY "trips_update"
  ON public.trips FOR UPDATE
  USING (
    client_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
    OR driver_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
  )
  WITH CHECK (
    client_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
    OR driver_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
  );

-- ═══════════════════════════════════════════════════════════════════
-- DELIVERIES (legacy ZopDelivery)
-- ═══════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view their deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Users can create deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Users can update their deliveries" ON public.deliveries;

CREATE POLICY "deliveries_insert"
  ON public.deliveries FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub')
    )
  );

CREATE POLICY "deliveries_update"
  ON public.deliveries FOR UPDATE
  USING (
    client_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
    OR driver_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
  )
  WITH CHECK (
    client_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
    OR driver_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
  );

-- ═══════════════════════════════════════════════════════════════════
-- VEHICLES
-- ═══════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Vehicles are viewable by everyone" ON public.vehicles;
DROP POLICY IF EXISTS "Owners can manage their vehicles" ON public.vehicles;

-- vehicles_select (deleted_at IS NULL) reste : les clients consultent les
-- véhicules avant de réserver.

CREATE POLICY "vehicles_insert"
  ON public.vehicles FOR INSERT
  WITH CHECK (
    owner_id IN (
      SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub')
    )
  );

CREATE POLICY "vehicles_update"
  ON public.vehicles FOR UPDATE
  USING (
    owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
  )
  WITH CHECK (
    owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
  );

CREATE POLICY "vehicles_delete"
  ON public.vehicles FOR DELETE
  USING (
    owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
  );

-- ═══════════════════════════════════════════════════════════════════
-- AUDIT_LOG
-- ═══════════════════════════════════════════════════════════════════

-- Contient old_data/new_data des profils, donc des données personnelles.
-- Seul l'admin le consulte (admin-ZopGo/src/App.tsx) ; le mobile ne le lit
-- jamais. La lecture publique de la migration 006 n'avait aucune raison d'être.
DROP POLICY IF EXISTS "audit_log_select" ON public.audit_log;

CREATE POLICY "audit_log_select"
  ON public.audit_log FOR SELECT
  USING ((auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin'));

-- L'insertion reste largement ouverte : elle vient du trigger d'audit, qui
-- s'exécute dans le contexte de l'utilisateur à l'origine de l'écriture. On
-- exige simplement un appelant authentifié, ce qui suffit à empêcher un
-- anonyme de polluer la table. La table reste append-only.
DROP POLICY IF EXISTS "audit_log_insert" ON public.audit_log;

CREATE POLICY "audit_log_insert"
  ON public.audit_log FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'sub') IS NOT NULL);
