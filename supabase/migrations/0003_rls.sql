-- ============================================================================
-- 0003_rls.sql — Row Level Security. Default-deny; service role bypasses RLS.
-- ============================================================================

alter table public.profiles             enable row level security;
alter table public.entitlements         enable row level security;
alter table public.purchases            enable row level security;
alter table public.followed_teams       enable row level security;
alter table public.predictions          enable row level security;
alter table public.leagues              enable row level security;
alter table public.league_members       enable row level security;
alter table public.notification_targets enable row level security;

-- profiles: own row read/update only.
drop policy if exists "own profile read" on public.profiles;
create policy "own profile read"   on public.profiles for select using (auth.uid() = id);
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles for update using (auth.uid() = id);

-- entitlements: read own only. No write policy => only service role writes.
drop policy if exists "own entitlements read" on public.entitlements;
create policy "own entitlements read" on public.entitlements for select using (auth.uid() = user_id);

-- purchases: read own only. Writes are webhook (service role) only.
drop policy if exists "own purchases read" on public.purchases;
create policy "own purchases read" on public.purchases for select using (auth.uid() = user_id);

-- followed_teams: full CRUD on own rows.
drop policy if exists "own follows" on public.followed_teams;
create policy "own follows" on public.followed_teams
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- predictions: manage own rows (protected columns enforced by trigger 0002).
drop policy if exists "own predictions" on public.predictions;
create policy "own predictions" on public.predictions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- leagues: members read; owner writes.
drop policy if exists "member reads league" on public.leagues;
create policy "member reads league" on public.leagues for select
  using (exists (select 1 from public.league_members m
                 where m.league_id = id and m.user_id = auth.uid()));
drop policy if exists "owner writes league" on public.leagues;
create policy "owner writes league" on public.leagues for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- league_members: read co-members; join self; leave self. points is service-role only.
drop policy if exists "read co-members" on public.league_members;
create policy "read co-members" on public.league_members for select
  using (exists (select 1 from public.league_members me
                 where me.league_id = league_members.league_id and me.user_id = auth.uid()));
drop policy if exists "join self" on public.league_members;
create policy "join self" on public.league_members for insert
  with check (auth.uid() = user_id);
drop policy if exists "leave self" on public.league_members;
create policy "leave self" on public.league_members for delete
  using (auth.uid() = user_id);

-- notification_targets: own rows only.
drop policy if exists "own notif targets" on public.notification_targets;
create policy "own notif targets" on public.notification_targets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
