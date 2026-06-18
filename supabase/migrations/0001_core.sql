-- ============================================================================
-- 0001_core.sql — core tables for Live League monetization
-- Apply in order (0001 → 0005) via the Supabase SQL Editor or `supabase db push`.
-- ============================================================================

create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- profiles: 1:1 mirror of auth.users; holds app-level user fields.
create table if not exists public.profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  email              text,
  display_name       text,
  avatar_url         text,
  prediction_points  integer not null default 0,   -- cached running total
  stripe_customer_id text unique,                   -- set on first checkout
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- entitlements: denormalized fast-read flags for gating. 1 row per user.
-- Written ONLY by the Stripe webhook (service role).
create table if not exists public.entitlements (
  user_id      uuid primary key references public.profiles(id) on delete cascade,
  has_personal boolean not null default false,      -- $5 bundle
  has_pro      boolean not null default false,      -- $20 bundle
  updated_at   timestamptz not null default now()
);

-- purchases: append-only audit / source of truth, fed by the Stripe webhook.
do $$ begin
  create type public.sku as enum ('personal', 'pro', 'combo');   -- $5 / $20 / $22
exception when duplicate_object then null;
end $$;

create table if not exists public.purchases (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.profiles(id) on delete cascade,
  sku                   public.sku not null,
  amount_cents          integer not null,
  currency              text not null default 'usd',
  stripe_event_id       text not null unique,        -- idempotency key (evt_…)
  stripe_session_id     text,
  stripe_payment_intent text,
  status                text not null default 'paid',-- paid | refunded
  created_at            timestamptz not null default now()
);
create index if not exists purchases_user_idx on public.purchases (user_id);

-- followed_teams: DB-backed replacement for localStorage favorites ($5 tier).
create table if not exists public.followed_teams (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  sport      text not null,                          -- 'soccer' | 'f1' | ...
  team_code  text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, sport, team_code)
);
create index if not exists followed_teams_user_idx on public.followed_teams (user_id);

-- predictions: one row per (user, match). Stores lock snapshot + scoring.
create table if not exists public.predictions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  tournament  text not null default 'wc2026',
  match_id    text not null,                          -- mirrors Game.id ("soccer-37")
  pred_home   smallint not null check (pred_home between 0 and 99),
  pred_away   smallint not null check (pred_away between 0 and 99),
  kickoff_utc timestamptz not null,                   -- lock snapshot
  locked      boolean not null default false,         -- flips true at kickoff
  actual_home smallint,
  actual_away smallint,
  points      smallint,                               -- 3 exact / 1 outcome / 0
  outcome     text,                                   -- 'exact' | 'result' | 'miss'
  scored_at   timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, match_id)
);
create index if not exists predictions_match_idx on public.predictions (match_id);
create index if not exists predictions_user_idx on public.predictions (user_id);
create index if not exists predictions_unscored_idx on public.predictions (scored_at)
  where scored_at is null;

-- leagues: friend leagues with a 6-char join code.
create table if not exists public.leagues (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 60),
  tournament text not null default 'wc2026',
  join_code  text not null unique,                    -- generated app-side
  owner_id   uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- league_members: membership + cached per-league points (leaderboard read path).
create table if not exists public.league_members (
  league_id uuid not null references public.leagues(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  points    integer not null default 0,               -- recomputed by scoring job
  joined_at timestamptz not null default now(),
  primary key (league_id, user_id)
);
create index if not exists league_members_user_idx on public.league_members (user_id);

-- notification_targets: OneSignal subscription ids per user (multi-device).
create table if not exists public.notification_targets (
  user_id      uuid not null references public.profiles(id) on delete cascade,
  onesignal_id text not null,
  created_at   timestamptz not null default now(),
  primary key (user_id, onesignal_id)
);
