-- ============================================
-- ZopGo - Reservations
-- ============================================

-- ============================================
-- 1. RESERVATIONS
-- ============================================
create table if not exists public.reservations (
  id uuid primary key default uuid_generate_v4(),
  trajet_id uuid not null references public.trajets(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  chauffeur_id uuid not null references public.profiles(id) on delete cascade,
  nombre_places integer not null default 1,
  prix_total integer not null default 0,
  status text not null default 'en_attente'
    check (status in ('en_attente', 'acceptee', 'refusee', 'annulee')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_reservations_trajet on public.reservations(trajet_id);
create index if not exists idx_reservations_client on public.reservations(client_id);
create index if not exists idx_reservations_chauffeur on public.reservations(chauffeur_id);
create index if not exists idx_reservations_status on public.reservations(status);
create index if not exists idx_reservations_created on public.reservations(created_at desc);

-- Trigger updated_at
drop trigger if exists set_reservations_updated_at on public.reservations;
create trigger set_reservations_updated_at
  before update on public.reservations
  for each row execute function public.handle_updated_at();

-- ============================================
-- 2. ROW LEVEL SECURITY
-- ============================================
alter table public.reservations enable row level security;

drop policy if exists "Users can view their reservations" on public.reservations;
create policy "Users can view their reservations"
  on public.reservations for select using (true);

drop policy if exists "Clients can create reservations" on public.reservations;
create policy "Clients can create reservations"
  on public.reservations for insert with check (true);

drop policy if exists "Users can update their reservations" on public.reservations;
create policy "Users can update their reservations"
  on public.reservations for update using (true);

-- ============================================
-- 3. NOTIFICATIONS DATA COLUMN
-- ============================================
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS data jsonb DEFAULT '{}'::jsonb;

-- ============================================
-- 4. TRAJETS STATUS CONSTRAINT (add 'complet')
-- ============================================
ALTER TABLE public.trajets DROP CONSTRAINT IF EXISTS trajets_status_check;
ALTER TABLE public.trajets ADD CONSTRAINT trajets_status_check
  CHECK (status IN ('en_attente', 'effectue', 'complet'));
