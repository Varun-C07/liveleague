-- ============================================================================
-- 0005_views.sql — leaderboard read path + reconciliation view
-- ============================================================================

-- league_leaderboard(league_id): returns a league's standings, but ONLY if the
-- caller is a member. SECURITY DEFINER so it can read co-members' display names
-- (public.profiles RLS otherwise restricts to own row); the membership check
-- below is the access guard.
create or replace function public.league_leaderboard(p_league_id uuid)
returns table (
  user_id      uuid,
  display_name text,
  avatar_url   text,
  points       integer,
  rank         bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select
    lm.user_id,
    pr.display_name,
    pr.avatar_url,
    lm.points,
    rank() over (order by lm.points desc, pr.display_name asc) as rank
  from public.league_members lm
  join public.profiles pr on pr.id = lm.user_id
  where lm.league_id = p_league_id
    and exists (
      select 1 from public.league_members me
      where me.league_id = p_league_id and me.user_id = auth.uid()
    );
$$;

grant execute on function public.league_leaderboard(uuid) to authenticated;

-- v_user_points: reconciliation/debug view. security_invoker => respects RLS, so
-- a signed-in user only sees their own total (compare against profiles.prediction_points).
create or replace view public.v_user_points
with (security_invoker = true) as
  select user_id, coalesce(sum(points), 0)::int as points
  from public.predictions
  where scored_at is not null
  group by user_id;
