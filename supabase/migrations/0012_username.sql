-- ============================================================================
-- 0012_username.sql — usernames for email/password signups.
-- Adds profiles.username (unique) and teaches the new-user trigger to populate
-- it (+ display_name) from the signup metadata. Email auth + Google OAuth both
-- flow through handle_new_user.
-- ============================================================================

alter table public.profiles add column if not exists username text;
create unique index if not exists profiles_username_key
  on public.profiles (lower(username)) where username is not null;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url, username)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'username'
    ),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'username'
  )
  on conflict (id) do nothing;
  insert into public.entitlements (user_id) values (new.id) on conflict do nothing;
  return new;
end; $$;
