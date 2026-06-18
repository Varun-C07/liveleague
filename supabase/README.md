# Supabase setup — Live League

The backend uses Supabase for Postgres + Auth. These migrations create the schema
for accounts, entitlements, predictions, leagues, and notifications.

## Apply the migrations

Two options:

**A. SQL Editor (simplest).** Open the Supabase dashboard → SQL Editor and run each
file in `migrations/` in order: `0001_core.sql` → `0002_triggers.sql` →
`0003_rls.sql` → `0004_realtime.sql` → `0005_views.sql`.

**B. Supabase CLI.**
```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push      # applies migrations/
```

The migrations are idempotent (safe to re-run): tables use `if not exists`,
policies/triggers are dropped-then-created, the enum and publication adds are
guarded.

## Configure Google OAuth (Phase 1)

Dashboard → Authentication → Providers → Google:
1. Create an OAuth 2.0 client in Google Cloud Console (APIs & Services → Credentials).
2. Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`.
3. Paste the Client ID + Secret into Supabase, enable the provider.
4. Add your site URL + `…/auth/callback` to Authentication → URL Configuration.

## Scheduler (Phase 4 — pg_cron)

Predictions lock at kickoff and auto-score after full-time via Supabase cron:
1. Dashboard → Database → Extensions → enable `pg_cron` and `pg_net`.
2. Schedule jobs (added by Phase 4) that `POST` the protected
   `/api/cron/lock` (every minute) and `/api/cron/score` (every 5 min) routes,
   sending `Authorization: Bearer <CRON_SECRET>`.

## Security notes

- The **service_role** key bypasses RLS — server-only, never in the browser.
- RLS is the real boundary; API-layer checks are UX. The `predictions` column
  guard (`0002`) is what stops a user self-awarding points.
