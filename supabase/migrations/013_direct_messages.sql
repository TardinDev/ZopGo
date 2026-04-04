-- ============================================
-- ZopGo - Direct Messages
-- ============================================

create table if not exists public.direct_messages (
  id uuid primary key default uuid_generate_v4(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  reservation_id uuid references public.reservations(id) on delete set null,
  content text not null,
  read boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_direct_messages_sender on public.direct_messages(sender_id);
create index if not exists idx_direct_messages_receiver on public.direct_messages(receiver_id);
create index if not exists idx_direct_messages_reservation on public.direct_messages(reservation_id);
create index if not exists idx_direct_messages_created on public.direct_messages(created_at desc);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table public.direct_messages enable row level security;

create policy "Users can view their direct messages"
  on public.direct_messages for select using (true);

create policy "Users can send direct messages"
  on public.direct_messages for insert with check (true);

create policy "Users can update received messages"
  on public.direct_messages for update using (true);
