-- ============================================================================
-- 0010_match_details.sql — rich per-match detail (ESPN summary) cache.
-- One row per match holding the normalized MatchDetail (goals, cards, subs, team
-- stats, lineups, venue/attendance/referee). Written on demand by the match
-- detail API: live matches refresh on a short cache; finished matches are stored
-- once (immutable) so past games are browsable straight from the DB.
-- Service-role only (the API reads/writes via the admin client).
-- ============================================================================

create table if not exists public.match_details (
  match_id      text primary key,             -- mirrors Game.id ("soccer-29")
  espn_event_id text,
  status        text not null default 'sched',-- 'sched' | 'live' | 'ft'
  payload       jsonb not null,               -- normalized MatchDetail
  updated_at    timestamptz not null default now()
);

alter table public.match_details enable row level security;
-- No policies: only the service role (the API) touches this table.
