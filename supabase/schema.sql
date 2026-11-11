-- Pokémon Arena v0.2 — execute apenas em um projeto Supabase NOVO deste jogo.
-- Cada usuário autenticado acessa somente seus próprios dados.
create table if not exists public.arena_teams (
  owner_id uuid not null references auth.users(id) on delete cascade,
  slot text not null default 'principal' check (char_length(slot) between 1 and 50),
  members jsonb not null check (jsonb_typeof(members) = 'array' and jsonb_array_length(members) = 6),
  updated_at timestamptz not null default now(),
  primary key (owner_id, slot)
);

create table if not exists public.arena_battle_history (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  opponent text not null check (char_length(opponent) between 1 and 100),
  mode text not null check (mode in ('pve', 'local', 'online')),
  outcome text not null check (outcome in ('win', 'loss', 'draw')),
  total_turns integer not null check (total_turns between 1 and 10000),
  played_at timestamptz not null default now()
);

create index if not exists arena_battle_history_owner_date
  on public.arena_battle_history (owner_id, played_at desc);

alter table public.arena_teams enable row level security;
alter table public.arena_battle_history enable row level security;

revoke all on public.arena_teams from anon;
revoke all on public.arena_battle_history from anon;
grant select, insert, update, delete on public.arena_teams to authenticated;
grant select, insert, update, delete on public.arena_battle_history to authenticated;

create policy "arena_teams_select_own" on public.arena_teams
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy "arena_teams_insert_own" on public.arena_teams
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "arena_teams_update_own" on public.arena_teams
  for update to authenticated using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "arena_teams_delete_own" on public.arena_teams
  for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "arena_history_select_own" on public.arena_battle_history
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy "arena_history_insert_own" on public.arena_battle_history
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "arena_history_delete_own" on public.arena_battle_history
  for delete to authenticated using ((select auth.uid()) = owner_id);
