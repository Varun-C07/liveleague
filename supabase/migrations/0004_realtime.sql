-- ============================================================================
-- 0004_realtime.sql — push changes to open clients (RLS still scopes delivery).
--   entitlements    → instant unlock on the post-checkout success page
--   predictions     → user sees their own scoring flip live
--   league_members  → leaderboard updates live after a match-day
-- ============================================================================

do $$ begin
  alter publication supabase_realtime add table public.entitlements;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.predictions;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.league_members;
exception when duplicate_object then null; end $$;
