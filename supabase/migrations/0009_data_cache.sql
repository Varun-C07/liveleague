-- ============================================================================
-- 0009_data_cache.sql — write-through cache for scraped live data.
-- One row per sport holding the latest successfully-normalized payload. The
-- API path writes it on every successful upstream fetch and reads it back when
-- the upstream feed is unreachable, so users get the last *real* data (not the
-- static June-14 snapshot) with no upstream latency. Service-role only.
-- ============================================================================

create table if not exists public.data_cache (
  sport      text primary key,                 -- 'soccer' | 'f1'
  payload    jsonb not null,                    -- normalized bundle (matches / games+standings)
  source     text not null default 'live',
  synced_at  timestamptz not null default now()
);

-- RLS on, no policies => only the service role (trusted server jobs) touches it.
alter table public.data_cache enable row level security;
