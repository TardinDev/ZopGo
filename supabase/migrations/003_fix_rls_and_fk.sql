-- ============================================
-- ZopGo - Fix RLS policies + FK constraints
-- ============================================
-- PREREQUIS : Configurer le JWT Clerk dans Supabase
--   1. Clerk Dashboard > JWT Templates > créer "supabase"
--      payload: { "sub": "{{user.id}}", "role": "authenticated" }
--   2. Supabase Dashboard > Authentication > JWT Secret
--      coller le signing key du template Clerk
-- ============================================

-- ============================================
-- 1. DROP anciennes policies permissives
-- ============================================

-- profiles
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;

-- vehicles
drop policy if exists "Vehicles are viewable by everyone" on public.vehicles;
drop policy if exists "Owners can manage their vehicles" on public.vehicles;

-- trips
drop policy if exists "Users can view their trips" on public.trips;
drop policy if exists "Users can create trips" on public.trips;
drop policy if exists "Users can update their trips" on public.trips;

-- deliveries
drop policy if exists "Users can view their deliveries" on public.deliveries;
drop policy if exists "Users can create deliveries" on public.deliveries;
drop policy if exists "Users can update their deliveries" on public.deliveries;

-- notifications
drop policy if exists "Users can view their notifications" on public.notifications;
drop policy if exists "Users can insert notifications" on public.notifications;
drop policy if exists "Users can update their notifications" on public.notifications;

-- trajets
drop policy if exists "Trajets are viewable by everyone" on public.trajets;
drop policy if exists "Chauffeurs can create trajets" on public.trajets;
drop policy if exists "Chauffeurs can update their trajets" on public.trajets;
drop policy if exists "Chauffeurs can delete their trajets" on public.trajets;

-- ============================================
-- 2. NOUVELLES POLICIES avec auth.jwt()
-- ============================================
-- auth.jwt() ->> 'sub' = Clerk user ID (correspond à clerk_id)

-- === PROFILES ===
-- Lecture publique (nécessaire pour lister les chauffeurs disponibles)
create policy "profiles_select"
  on public.profiles for select
  using (true);

-- Insertion : uniquement son propre profil
create policy "profiles_insert"
  on public.profiles for insert
  with check ((auth.jwt() ->> 'sub') = clerk_id);

-- Modification : uniquement son propre profil
create policy "profiles_update"
  on public.profiles for update
  using ((auth.jwt() ->> 'sub') = clerk_id)
  with check ((auth.jwt() ->> 'sub') = clerk_id);

-- === VEHICLES ===
-- Lecture publique
create policy "vehicles_select"
  on public.vehicles for select
  using (true);

-- CRUD : uniquement le propriétaire
create policy "vehicles_insert"
  on public.vehicles for insert
  with check (
    owner_id in (select id from public.profiles where clerk_id = (auth.jwt() ->> 'sub'))
  );

create policy "vehicles_update"
  on public.vehicles for update
  using (
    owner_id in (select id from public.profiles where clerk_id = (auth.jwt() ->> 'sub'))
  );

create policy "vehicles_delete"
  on public.vehicles for delete
  using (
    owner_id in (select id from public.profiles where clerk_id = (auth.jwt() ->> 'sub'))
  );

-- === TRIPS ===
-- Lecture : client ou chauffeur du trip
create policy "trips_select"
  on public.trips for select
  using (
    client_id in (select id from public.profiles where clerk_id = (auth.jwt() ->> 'sub'))
    or driver_id in (select id from public.profiles where clerk_id = (auth.jwt() ->> 'sub'))
  );

-- Création : le client crée le trip
create policy "trips_insert"
  on public.trips for insert
  with check (
    client_id in (select id from public.profiles where clerk_id = (auth.jwt() ->> 'sub'))
  );

-- Modification : client ou chauffeur du trip
create policy "trips_update"
  on public.trips for update
  using (
    client_id in (select id from public.profiles where clerk_id = (auth.jwt() ->> 'sub'))
    or driver_id in (select id from public.profiles where clerk_id = (auth.jwt() ->> 'sub'))
  );

-- === DELIVERIES ===
create policy "deliveries_select"
  on public.deliveries for select
  using (
    client_id in (select id from public.profiles where clerk_id = (auth.jwt() ->> 'sub'))
    or driver_id in (select id from public.profiles where clerk_id = (auth.jwt() ->> 'sub'))
  );

create policy "deliveries_insert"
  on public.deliveries for insert
  with check (
    client_id in (select id from public.profiles where clerk_id = (auth.jwt() ->> 'sub'))
  );

create policy "deliveries_update"
  on public.deliveries for update
  using (
    client_id in (select id from public.profiles where clerk_id = (auth.jwt() ->> 'sub'))
    or driver_id in (select id from public.profiles where clerk_id = (auth.jwt() ->> 'sub'))
  );

-- === NOTIFICATIONS ===
-- Lecture : ses propres notifications ou celles de son rôle
create policy "notifications_select"
  on public.notifications for select
  using (
    recipient_id in (select id from public.profiles where clerk_id = (auth.jwt() ->> 'sub'))
    or recipient_role = 'all'
    or recipient_role in (select role from public.profiles where clerk_id = (auth.jwt() ->> 'sub'))
  );

-- Insertion : système uniquement (ou utilisateur authentifié)
create policy "notifications_insert"
  on public.notifications for insert
  with check (auth.jwt() ->> 'sub' is not null);

-- Modification : marquer ses propres notifications comme lues
create policy "notifications_update"
  on public.notifications for update
  using (
    recipient_id in (select id from public.profiles where clerk_id = (auth.jwt() ->> 'sub'))
  );

-- === TRAJETS ===
-- Lecture publique (tous les utilisateurs voient les trajets disponibles)
create policy "trajets_select"
  on public.trajets for select
  using (true);

-- CRUD : uniquement le chauffeur propriétaire
create policy "trajets_insert"
  on public.trajets for insert
  with check (
    chauffeur_id in (select id from public.profiles where clerk_id = (auth.jwt() ->> 'sub'))
  );

create policy "trajets_update"
  on public.trajets for update
  using (
    chauffeur_id in (select id from public.profiles where clerk_id = (auth.jwt() ->> 'sub'))
  );

create policy "trajets_delete"
  on public.trajets for delete
  using (
    chauffeur_id in (select id from public.profiles where clerk_id = (auth.jwt() ->> 'sub'))
  );

-- ============================================
-- 3. FK ON DELETE manquantes
-- ============================================

-- trips.driver_id → SET NULL si le chauffeur est supprimé
alter table public.trips
  drop constraint if exists trips_driver_id_fkey,
  add constraint trips_driver_id_fkey
    foreign key (driver_id) references public.profiles(id) on delete set null;

-- trips.vehicle_id → SET NULL si le véhicule est supprimé
alter table public.trips
  drop constraint if exists trips_vehicle_id_fkey,
  add constraint trips_vehicle_id_fkey
    foreign key (vehicle_id) references public.vehicles(id) on delete set null;

-- deliveries.driver_id → SET NULL
alter table public.deliveries
  drop constraint if exists deliveries_driver_id_fkey,
  add constraint deliveries_driver_id_fkey
    foreign key (driver_id) references public.profiles(id) on delete set null;

-- deliveries.vehicle_id → SET NULL
alter table public.deliveries
  drop constraint if exists deliveries_vehicle_id_fkey,
  add constraint deliveries_vehicle_id_fkey
    foreign key (vehicle_id) references public.vehicles(id) on delete set null;

-- ============================================
-- 4. INDEX composites manquants
-- ============================================
create index if not exists idx_trips_status_created on public.trips(status, created_at desc);
create index if not exists idx_deliveries_status_created on public.deliveries(status, created_at desc);
create index if not exists idx_notifications_recipient_created on public.notifications(recipient_id, created_at desc);
