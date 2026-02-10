-- ============================================
-- ZopGo - Schema initial
-- ============================================

-- Extension UUID
create extension if not exists "uuid-ossp";

-- ============================================
-- 1. PROFILES
-- ============================================
create table public.profiles (
  id uuid primary key default uuid_generate_v4(),
  clerk_id text unique,
  role text not null default 'client' check (role in ('client', 'chauffeur')),
  name text not null,
  email text unique not null,
  phone text default '',
  avatar text default '',
  rating numeric(2,1) default 5.0,
  total_trips integer default 0,
  total_deliveries integer default 0,
  disponible boolean default false,
  member_since timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Index pour recherche rapide
create index idx_profiles_clerk_id on public.profiles(clerk_id);
create index idx_profiles_role on public.profiles(role);
create index idx_profiles_disponible on public.profiles(disponible) where role = 'chauffeur';

-- ============================================
-- 2. VEHICLES (véhicules des chauffeurs)
-- ============================================
create table public.vehicles (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('moto', 'velo', 'voiture', 'camionnette')),
  label text not null,
  brand text default '',
  model text default '',
  plate_number text default '',
  year integer,
  color text default '',
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index idx_vehicles_owner on public.vehicles(owner_id);
create index idx_vehicles_type on public.vehicles(type);

-- ============================================
-- 3. TRIPS (voyages / courses)
-- ============================================
create table public.trips (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references public.profiles(id),
  driver_id uuid references public.profiles(id),
  vehicle_id uuid references public.vehicles(id),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
  from_address text not null,
  to_address text not null,
  from_lat double precision,
  from_lng double precision,
  to_lat double precision,
  to_lng double precision,
  distance_km numeric(8,2),
  duration_min integer,
  price integer default 0, -- en FCFA
  payment_method text default 'cash' check (payment_method in ('cash', 'mobile_money', 'card')),
  rating integer check (rating between 1 and 5),
  comment text,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index idx_trips_client on public.trips(client_id);
create index idx_trips_driver on public.trips(driver_id);
create index idx_trips_status on public.trips(status);
create index idx_trips_created on public.trips(created_at desc);

-- ============================================
-- 4. DELIVERIES (livraisons)
-- ============================================
create table public.deliveries (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references public.profiles(id),
  driver_id uuid references public.profiles(id),
  vehicle_id uuid references public.vehicles(id),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled')),
  pickup_address text not null,
  dropoff_address text not null,
  pickup_lat double precision,
  pickup_lng double precision,
  dropoff_lat double precision,
  dropoff_lng double precision,
  package_description text default '',
  package_size text default 'medium' check (package_size in ('small', 'medium', 'large', 'extra_large')),
  distance_km numeric(8,2),
  price integer default 0, -- en FCFA
  payment_method text default 'cash' check (payment_method in ('cash', 'mobile_money', 'card')),
  rating integer check (rating between 1 and 5),
  comment text,
  picked_up_at timestamp with time zone,
  delivered_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index idx_deliveries_client on public.deliveries(client_id);
create index idx_deliveries_driver on public.deliveries(driver_id);
create index idx_deliveries_status on public.deliveries(status);
create index idx_deliveries_created on public.deliveries(created_at desc);

-- ============================================
-- 5. FUNCTION: updated_at automatique
-- ============================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers updated_at
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger set_vehicles_updated_at
  before update on public.vehicles
  for each row execute function public.handle_updated_at();

create trigger set_trips_updated_at
  before update on public.trips
  for each row execute function public.handle_updated_at();

create trigger set_deliveries_updated_at
  before update on public.deliveries
  for each row execute function public.handle_updated_at();

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================
alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.trips enable row level security;
alter table public.deliveries enable row level security;

-- Profiles: tout le monde peut lire, seul le propriétaire peut modifier
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (true);

create policy "Users can insert own profile"
  on public.profiles for insert with check (true);

-- Vehicles: lecture publique, modification par le propriétaire
create policy "Vehicles are viewable by everyone"
  on public.vehicles for select using (true);

create policy "Owners can manage their vehicles"
  on public.vehicles for all using (true);

-- Trips: les participants peuvent voir et gérer leurs courses
create policy "Users can view their trips"
  on public.trips for select using (true);

create policy "Users can create trips"
  on public.trips for insert with check (true);

create policy "Users can update their trips"
  on public.trips for update using (true);

-- Deliveries: les participants peuvent voir et gérer leurs livraisons
create policy "Users can view their deliveries"
  on public.deliveries for select using (true);

create policy "Users can create deliveries"
  on public.deliveries for insert with check (true);

create policy "Users can update their deliveries"
  on public.deliveries for update using (true);
