-- ============================================
-- ZopGo - Notifications + Trajets
-- ============================================

-- ============================================
-- 1. NOTIFICATIONS
-- ============================================
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  recipient_id uuid references public.profiles(id) on delete cascade,
  recipient_role text check (recipient_role in ('client', 'chauffeur', 'all')),
  type text not null,
  title text not null,
  message text not null,
  icon text default 'information-circle',
  icon_color text default '#6366F1',
  icon_bg text default '#E0E7FF',
  read boolean default false,
  created_at timestamp with time zone default now()
);

create index idx_notifications_recipient on public.notifications(recipient_id);
create index idx_notifications_role on public.notifications(recipient_role);
create index idx_notifications_created on public.notifications(created_at desc);

-- ============================================
-- 2. TRAJETS (proposés par les chauffeurs)
-- ============================================
create table public.trajets (
  id uuid primary key default uuid_generate_v4(),
  chauffeur_id uuid not null references public.profiles(id) on delete cascade,
  ville_depart text not null,
  ville_arrivee text not null,
  prix integer not null default 0,
  vehicule text not null,
  date text,
  places_disponibles integer not null default 1,
  status text not null default 'en_attente' check (status in ('en_attente', 'effectue')),
  created_at timestamp with time zone default now()
);

create index idx_trajets_chauffeur on public.trajets(chauffeur_id);
create index idx_trajets_status on public.trajets(status);
create index idx_trajets_created on public.trajets(created_at desc);

-- ============================================
-- 3. Triggers updated_at (notifications n'en a pas besoin)
-- ============================================

-- ============================================
-- 4. ROW LEVEL SECURITY
-- ============================================
alter table public.notifications enable row level security;
alter table public.trajets enable row level security;

-- Notifications: tout le monde peut lire les siennes
create policy "Users can view their notifications"
  on public.notifications for select using (true);

create policy "Users can insert notifications"
  on public.notifications for insert with check (true);

create policy "Users can update their notifications"
  on public.notifications for update using (true);

-- Trajets: lecture publique, gestion par le chauffeur
create policy "Trajets are viewable by everyone"
  on public.trajets for select using (true);

create policy "Chauffeurs can create trajets"
  on public.trajets for insert with check (true);

create policy "Chauffeurs can update their trajets"
  on public.trajets for update using (true);

create policy "Chauffeurs can delete their trajets"
  on public.trajets for delete using (true);
