-- ============================================================================
-- 0008_notifications.sql — in-app notification feed ($5 tier, Phase 6).
-- Kickoff / full-time alerts for matches involving a user's followed teams.
-- In-app only for now (bell + feed); an external push/email sender can read the
-- same rows later. Inserted by the cron job (service role); the unique key makes
-- generation idempotent so re-runs never duplicate an alert.
-- ============================================================================

do $$ begin
  create type public.notification_type as enum ('kickoff', 'fulltime');
exception when duplicate_object then null;
end $$;

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       public.notification_type not null,
  sport      text not null default 'soccer',
  match_id   text not null,                 -- mirrors Game.id ("soccer-37")
  title      text not null,
  body       text not null,
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at    timestamptz,
  unique (user_id, match_id, type)          -- one kickoff + one FT per match/user
);
create index if not exists notifications_user_idx
  on public.notifications (user_id, created_at desc);
create index if not exists notifications_unread_idx
  on public.notifications (user_id) where read_at is null;

alter table public.notifications enable row level security;

-- Read own; mark own as read (update). No insert/delete policy => the cron job
-- (service role) is the only writer.
drop policy if exists "own notifications read" on public.notifications;
create policy "own notifications read" on public.notifications
  for select using (auth.uid() = user_id);
drop policy if exists "own notifications update" on public.notifications;
create policy "own notifications update" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
