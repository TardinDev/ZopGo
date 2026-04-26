-- ============================================
-- ZopGo — Migration 018 : Admin Messages (broadcast admin → users)
-- ============================================
-- Permet à l'admin web (admin-ZopGo) d'envoyer des annonces ciblées
-- aux utilisateurs de l'app mobile : un user, tous les utilisateurs
-- d'un rôle, ou tout le monde.
--
-- Tables :
--   - admin_messages       : le message lui-même
--   - admin_message_reads  : tracking de lecture (PK composite)
--
-- RLS :
--   - Admin (JWT admin_role='admin') : full access
--   - Users : SELECT uniquement les messages qui les ciblent ; INSERT
--             leurs propres reads
-- ============================================

-- ============================================
-- 1. Table admin_messages
-- ============================================
create extension if not exists pgcrypto;

create table if not exists public.admin_messages (
  id uuid primary key default gen_random_uuid(),
  sender_clerk_id text not null,
  sender_name text not null,
  target_type text not null check (target_type in ('user', 'role', 'all')),
  target_user_id uuid references public.profiles(id) on delete cascade,
  target_role text check (target_role in ('client', 'chauffeur', 'hebergeur')),
  title text not null,
  body text not null,
  push_sent boolean not null default false,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  constraint admin_messages_target_consistency check (
    (target_type = 'user' and target_user_id is not null and target_role is null)
    or (target_type = 'role' and target_role is not null and target_user_id is null)
    or (target_type = 'all' and target_user_id is null and target_role is null)
  )
);

create index if not exists idx_admin_messages_target_type
  on public.admin_messages(target_type);
create index if not exists idx_admin_messages_target_user
  on public.admin_messages(target_user_id)
  where target_user_id is not null;
create index if not exists idx_admin_messages_target_role
  on public.admin_messages(target_role)
  where target_role is not null;
create index if not exists idx_admin_messages_created
  on public.admin_messages(created_at desc);

-- ============================================
-- 2. Table admin_message_reads
-- ============================================
create table if not exists public.admin_message_reads (
  message_id uuid not null references public.admin_messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create index if not exists idx_admin_message_reads_user
  on public.admin_message_reads(user_id);

-- ============================================
-- 3. Row Level Security
-- ============================================
alter table public.admin_messages enable row level security;
alter table public.admin_message_reads enable row level security;

-- ─── Admin (admin_role JWT) — full access ──────────────────
drop policy if exists "admin_admin_messages_all" on public.admin_messages;
create policy "admin_admin_messages_all"
  on public.admin_messages for all
  using ((auth.jwt() ->> 'admin_role') = 'admin')
  with check ((auth.jwt() ->> 'admin_role') = 'admin');

drop policy if exists "admin_admin_message_reads_select" on public.admin_message_reads;
create policy "admin_admin_message_reads_select"
  on public.admin_message_reads for select
  using ((auth.jwt() ->> 'admin_role') = 'admin');

-- ─── Users — SELECT uniquement les messages qui les ciblent ──
-- Cible = 'all' OU rôle correspond OU user_id correspond.
-- On filtre aussi les messages expirés côté DB pour réduire la charge mobile.
drop policy if exists "users_select_admin_messages" on public.admin_messages;
create policy "users_select_admin_messages"
  on public.admin_messages for select
  using (
    (expires_at is null or expires_at > now())
    and (
      target_type = 'all'
      or (
        target_type = 'role'
        and target_role = (
          select role from public.profiles
          where clerk_id = (auth.jwt() ->> 'sub')
          limit 1
        )
      )
      or (
        target_type = 'user'
        and target_user_id = (
          select id from public.profiles
          where clerk_id = (auth.jwt() ->> 'sub')
          limit 1
        )
      )
    )
  );

-- ─── Users — INSERT et SELECT leurs propres reads ──────────
drop policy if exists "users_insert_own_read" on public.admin_message_reads;
create policy "users_insert_own_read"
  on public.admin_message_reads for insert
  with check (
    user_id = (
      select id from public.profiles
      where clerk_id = (auth.jwt() ->> 'sub')
      limit 1
    )
  );

drop policy if exists "users_select_own_reads" on public.admin_message_reads;
create policy "users_select_own_reads"
  on public.admin_message_reads for select
  using (
    user_id = (
      select id from public.profiles
      where clerk_id = (auth.jwt() ->> 'sub')
      limit 1
    )
  );

-- ============================================
-- 4. Realtime — push live à l'app mobile
-- ============================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'admin_messages'
  ) then
    alter publication supabase_realtime add table public.admin_messages;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'admin_message_reads'
  ) then
    alter publication supabase_realtime add table public.admin_message_reads;
  end if;
end $$;
