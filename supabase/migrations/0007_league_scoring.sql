-- ============================================================================
-- 0007_league_scoring.sql — per-league scoring recompute
-- Profile total = all scored points. Per-league points = only predictions the
-- member made AFTER joining that league (created_at >= league_members.joined_at).
-- Called by the scoring cron for each affected user (service role / definer).
-- ============================================================================

create or replace function public.recompute_user_points(p_user uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles
    set prediction_points = coalesce(
      (select sum(points) from public.predictions
       where user_id = p_user and scored_at is not null), 0),
        updated_at = now()
  where id = p_user;

  update public.league_members lm
    set points = coalesce(
      (select sum(p.points) from public.predictions p
       where p.user_id = p_user
         and p.scored_at is not null
         and p.created_at >= lm.joined_at), 0)
  where lm.user_id = p_user;
$$;
