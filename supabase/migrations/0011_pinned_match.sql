-- ============================================================================
-- 0011_pinned_match.sql — a user's pinned (favourite) match.
-- One match id pinned to the top of the board; persists only while signed in.
-- ============================================================================

alter table public.profiles add column if not exists pinned_match text;
-- Read/update is already covered by the existing own-profile RLS policies.
