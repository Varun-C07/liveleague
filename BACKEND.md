# BACKEND.md — Back-end Change Log

A running log of back-end changes to Live League (data layer, APIs, auth,
payments, caching, data sources), with timestamps, so any session can pick up
the thread of what's been touched and why. Pair with **FRONTEND.md** (UI) and
**CLAUDE.md** (project overview).

**How to use this file**
- Add a new entry at the **top** of the Log (newest first) for each back-end change.
- Keep entries short: what changed, where, and why. Link files with relative paths.
- Timestamp format: `YYYY-MM-DD HH:MM TZ` (runtime clock).
- When you add/modify a migration, table, API route, cron job, or data source,
  update both the **Log** and the **Architecture map** below.
- This tracks **back-end work only** — see git history for the full record.

---

## Architecture map (current state)

**Stack:** Next.js 15 route handlers + server components · Supabase (Postgres +
Auth + Realtime) · Stripe (subscriptions) · free data feeds.

**Data sources**
- **Soccer:** ESPN free scoreboard = **live** source (real-time scores/minute/
  status, `lib/espn-soccer.ts`); TheSportsDB free = one-time historical backfill
  only (`lib/tsdb.ts`); static schedule/venues from the snapshot (`data/`).
- **F1:** Jolpica/Ergast (`lib/sports/f1.ts`) — driver + constructor standings,
  podiums, full names. Free.
- **Fallbacks:** per-sport snapshots; never labelled "Offline" (bundle `reason`).

**Supabase migrations** (`supabase/migrations/`, applied via Management API)
- `0001_core` tables · `0002_triggers` · `0003_rls` · `0004_realtime` ·
  `0005_views` · `0006_subscriptions` · `0007_league_scoring` ·
  `0008_notifications` · `0009_data_cache`.

**Tables:** `profiles`, `entitlements`, `purchases`, `followed_teams`,
`predictions`, `leagues`, `league_members`, `notification_targets`,
`notifications`, `data_cache`.

**Key libs** (`lib/`)
- DB clients: `db/supabase-{browser,server,admin}.ts`, write-through cache
  `db/cache.ts`.
- Gating/auth: `gating.ts` (pure), `entitlements.ts` (require* + GateError).
- Pure logic (unit-tested in `tests/`): `scoring.ts`, `joincode.ts`,
  `group-scenarios.ts`, `standings.ts`, `favorites.ts`.
- Stripe: `stripe/{client,skus}.ts`. Data: `tsdb.ts`, `espn-soccer.ts`,
  `normalize.ts` (`applyEvents`/`clampLive`), `snapshot.ts`, `sports/*`.

**API routes** (`app/api/`)
- Data: `soccer`, `soccer/standings`, `f1`, `live`, `agenda` (cache-first,
  `force-dynamic`, `s-maxage`).
- $5 tier: `me`, `me/follows`, `predictions`, `leagues`, `leagues/[id]`,
  `leagues/join`, `notifications`.
- Payments/auth: `checkout`, `webhooks/stripe`, `app/auth/callback`.
- Cron (Bearer `CRON_SECRET`): `cron/lock`, `cron/score`, `cron/notify`.

**Cron:** `supabase/cron-setup.sql` (pg_cron + pg_net) — **deferred until
go-live**; jobs `ll-lock` / `ll-score` / `ll-notify`. Not active in prod yet.

**Deploy:** GitHub Actions (`.github/workflows/deploy.yml`) gated on lint+tests;
manual `npx vercel deploy --prod --token $VERCEL_TOKEN`. Prod:
`https://liveleague-omega.vercel.app`.

---

## Log

### 2026-06-19 17:31 EDT — Real-time soccer scores via ESPN + live-gated fetching
- **ESPN is now the live soccer source** — `lib/espn-soccer.ts`. TheSportsDB's
  free feed lagged badly (reported 1-0/"1H" when a match was really 2-0/66'); ESPN's
  free scoreboard (already used for NBA/MLB) is real-time. Normalized into the
  `RawEvent` shape `applyEvents` already consumes.
- **`getMatches` is cache-first AND live-gated** — `lib/tsdb.ts`. Static data
  (schedule/venues/teams/finished results/standings) is served from the stored
  cache with no API call. The live feed is hit **only** when a match is in its
  play window (`liveWindowActive`), so idle page refreshes cost zero upstream
  requests. TheSportsDB rounds are now used only for the cold-cache backfill.
- **Why:** scores were stuck (free TheSportsDB lag) and the upstream was being
  hit on every refresh. Now fresh within ~15-30s during a match, quiet otherwise.

### 2026-06-18 23:37 EDT — Cache-first data path (instant loads)
- **`getMatches` (soccer) + `f1Adapter.getLive` serve the stored bundle first**,
  refresh after — `lib/tsdb.ts`, `lib/sports/f1.ts`. SSR pages (`/`, `/soccer`,
  `/f1`) are async + `force-dynamic` and seed from shared cache-first builders
  (`lib/snapshot.ts` `liveMatchesResponse`/`liveStandingsResponse`), so first
  paint is the latest *stored* data, not the static snapshot. Added a 7s
  `AbortController` fetch timeout so a slow upstream can't hang a request.
- **Why:** site took minutes to load and reset to the June-14 snapshot on reload.

### 2026-06-18 23:17 EDT — Write-through data cache (`data_cache`)
- **`0009_data_cache.sql`** — one JSONB row per sport, service-role only.
  `lib/db/cache.ts` (`readCache`/`writeCache`, no-ops when Supabase unconfigured).
  Soccer/F1 adapters write the freshest real bundle and read it back on outage.
- **Why:** persist scraped data so cold starts / API outages serve real data.

### 2026-06-18 22:49 EDT — Phase 7: soccer staleness fix + F1 free data
- **Soccer fix** — `lib/tsdb.ts`. TheSportsDB `eventsseason` is free-capped at 15
  events (froze the board at June 15); switched to uncapped `eventsround`
  (group rounds) + rolling `eventsday` window, merged through `applyEvents`.
- **F1 free wins** — `lib/sports/f1.ts`. Constructor standings
  (`constructorStandings.json`) + full driver names; optional
  `constructorStandings`/`constructorTitle` added to `LiveBundle`
  (`lib/sports/types.ts`).
- **Why:** real scores for the whole tournament + revive the dropped F1 data, $0.

### 2026-06-18 21:56 EDT — Phase 6: group tracker + in-app notifications ($5 tier)
- **Qualification solver** — `lib/group-scenarios.ts` (pure, full W/D/L
  enumeration → through/contention/alive/out + plain-English line; unit-tested).
- **Notifications** — `0008_notifications.sql` (`notifications` table, unique
  `(user,match,type)` ⇒ idempotent, RLS read/update-own, service-role insert).
  `app/api/cron/notify` fans kickoff/full-time alerts to followers via
  `followed_teams`; `app/api/notifications` (GET feed + unread, PATCH mark-read).
  `ll-notify` added to `cron-setup.sql`.
- **Why:** closes out the $5 bundle (last two features).

### 2026-06-18 18:42 EDT — Phase 5: friend leagues + per-league scoring
- **Leagues** — `leagues` + `league_members` tables, `0007_league_scoring.sql`
  (`league_leaderboard`, `recompute_user_points` definer fn; per-league scoring
  counts only predictions made after `joined_at`). Routes `app/api/leagues`,
  `leagues/[id]`, `leagues/join`. Join codes: `lib/joincode.ts` (pure).
- **Why:** viral conversion loop — free users join + view, predicting needs $5.

### 2026-06-18 14:58 EDT — Phase 4: match predictor + scoring engine
- **`predictions` table** + `app/api/predictions`; pure `lib/scoring.ts`
  (3 exact / 1 outcome / 0). `app/api/cron/{lock,score}` — lock at kickoff,
  score finished matches idempotently (only unscored rows; totals recomputed by
  SUM). Column-guard trigger prevents users editing scored fields.
- **Why:** core engagement mechanic of the $5 bundle.

### 2026-06-18 10:25 EDT — Phase 3: DB-backed follow-your-teams
- **`followed_teams` table** (`(user_id, sport, team_code)`, 4-cap trigger),
  `app/api/me/follows`. `hooks/useFavorites` made auth-aware (same public API,
  localStorage fallback when signed out).
- **Why:** move favorites server-side for the $5 tier.

### 2026-06-18 10:00 EDT — Phase 2: Stripe subscriptions + entitlements
- **`entitlements` + `purchases`** tables, `0006_subscriptions.sql`
  (`subscriptions`). `app/api/checkout` (mode: subscription),
  `app/api/webhooks/stripe` (signature-verified, syncs subs → entitlements).
  Gating: `lib/gating.ts` (pure), `lib/entitlements.ts`, `lib/stripe/*`. SKUs:
  personal ($5) / pro ($20) / combo ($22) recurring prices.
- **Why:** monetization spine. NB: prod webhook endpoint still to be registered.

### 2026-06-18 01:49 EDT — Phase 1: Google sign-in via Supabase Auth
- **Auth** via `@supabase/ssr` — `lib/db/supabase-{browser,server}.ts`,
  `middleware.ts` (no-op without env, excludes `/api/webhooks`),
  `app/auth/callback`. `app/api/me` bootstrap. `handle_new_user` trigger mirrors
  `auth.users` → `profiles`.
- **Why:** identity for every $5 feature.

### 2026-06-18 01:07 EDT — Phase 0: repo flatten + Supabase foundation
- Flattened repo to root; single remote (`Ayush-Chaudhary/liveleague`, `main`).
  `0001_core` / `0002_triggers` / `0003_rls` / `0004_realtime` / `0005_views`
  migrations (profiles, entitlements, RLS default-deny, Realtime, leaderboard
  views). Admin client `lib/db/supabase-admin.ts` (`server-only`, bypasses RLS).
  Token-based Vercel deploy via GitHub Actions.
- **Why:** backend baseline for the monetization phases.
