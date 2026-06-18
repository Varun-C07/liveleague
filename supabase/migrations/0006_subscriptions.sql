-- ============================================================================
-- 0006_subscriptions.sql — Stripe subscription tracking (recurring model)
-- Entitlements (has_personal/has_pro) are recomputed from active subscriptions
-- by the Stripe webhook. This table is the source of truth for billing state.
-- ============================================================================

create table if not exists public.subscriptions (
  id                   text primary key,                 -- Stripe subscription id (sub_…)
  user_id              uuid not null references public.profiles(id) on delete cascade,
  sku                  public.sku not null,              -- personal | pro | combo
  status               text not null,                    -- active | trialing | past_due | canceled | …
  price_id             text,
  current_period_end   timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists subscriptions_user_idx on public.subscriptions (user_id);

alter table public.subscriptions enable row level security;

-- read own subscriptions; writes are service-role (webhook) only.
drop policy if exists "own subscriptions read" on public.subscriptions;
create policy "own subscriptions read" on public.subscriptions
  for select using (auth.uid() = user_id);

-- push billing changes to open clients (e.g. instant unlock on the success page).
do $$ begin
  alter publication supabase_realtime add table public.subscriptions;
exception when duplicate_object then null; end $$;
