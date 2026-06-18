-- ============================================================================
-- 0002_triggers.sql — auto-provisioning, follow cap, prediction column guard
-- ============================================================================

-- Auto-create profile + entitlements row on signup.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  insert into public.entitlements (user_id) values (new.id) on conflict do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Enforce the 4-team follow cap per sport at the DB layer (defense in depth).
create or replace function public.enforce_follow_cap()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.followed_teams
      where user_id = new.user_id and sport = new.sport) >= 4 then
    raise exception 'follow_cap_reached';
  end if;
  return new;
end; $$;

drop trigger if exists trg_follow_cap on public.followed_teams;
create trigger trg_follow_cap
  before insert on public.followed_teams
  for each row execute function public.enforce_follow_cap();

-- Guard protected prediction columns: users may set their pick, but only the
-- service role may set locked/points/outcome/actual_*, and a locked prediction
-- can no longer be edited by the user.
create or replace function public.guard_prediction_cols()
returns trigger language plpgsql as $$
begin
  if auth.role() <> 'service_role' then
    if new.locked      is distinct from old.locked      or
       new.points      is distinct from old.points      or
       new.outcome     is distinct from old.outcome     or
       new.actual_home is distinct from old.actual_home or
       new.actual_away is distinct from old.actual_away or
       new.scored_at   is distinct from old.scored_at then
      raise exception 'protected_columns';
    end if;
    if old.locked then
      raise exception 'prediction_locked';
    end if;
  end if;
  return new;
end; $$;

drop trigger if exists trg_guard_prediction_cols on public.predictions;
create trigger trg_guard_prediction_cols
  before update on public.predictions
  for each row execute function public.guard_prediction_cols();
