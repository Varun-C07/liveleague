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
  status, `lib/espn-soccer.ts`); ESPN free `summary` = **per-match detail**
  (goals/cards/subs, team stats, lineups, venue/att/ref — `lib/espn-summary.ts`);
  TheSportsDB free = one-time historical backfill only (`lib/tsdb.ts`); static
  schedule/venues from the snapshot (`data/`).
- **F1:** Jolpica/Ergast (`lib/sports/f1.ts`) — driver + constructor standings,
  podiums, full names; per-race detail (results/grid/status/points, fastest lap,
  qualifying, pit stops — `lib/jolpica-race.ts`). Free, post-session.
- **Fallbacks:** per-sport snapshots; never labelled "Offline" (bundle `reason`).

**Supabase migrations** (`supabase/migrations/`, applied via Management API)
- `0001_core` tables · `0002_triggers` · `0003_rls` · `0004_realtime` ·
  `0005_views` · `0006_subscriptions` · `0007_league_scoring` ·
  `0008_notifications` · `0009_data_cache` · `0010_match_details` ·
  `0011_pinned_match` (profiles.pinned_match) · `0012_username`
  (profiles.username unique).

**Tables:** `profiles`, `entitlements`, `purchases`, `followed_teams`,
`predictions`, `leagues`, `league_members`, `notification_targets`,
`notifications`, `data_cache`, `match_details`.

**Key libs** (`lib/`)
- DB clients: `db/supabase-{browser,server,admin}.ts`, write-through cache
  `db/cache.ts`.
- Gating/auth: `gating.ts` (pure), `entitlements.ts` (require* + GateError).
- Pure logic (unit-tested in `tests/`): `scoring.ts`, `joincode.ts`,
  `group-scenarios.ts`, `standings.ts`, `favorites.ts`.
- Stripe: `stripe/{client,skus}.ts`. Data: `tsdb.ts`, `espn-soccer.ts`,
  `espn-summary.ts` (pure `normalizeSummary` + `fetchMatchDetail`),
  `normalize.ts` (`applyEvents`/`clampLive`), `snapshot.ts`, `sports/*`.

**API routes** (`app/api/`)
- Data: `soccer`, `soccer/standings`, `soccer/match/[id]`, `f1`,
  `f1/race/[id]` (rich race detail, DB-first + on-demand), `live`, `agenda`
  (cache-first, `force-dynamic`, `s-maxage`).
- $5 tier: `me`, `me/follows`, `predictions`, `leagues`, `leagues/[id]`,
  `leagues/join`, `notifications`.
- Payments/auth: `checkout`, `webhooks/stripe`, `app/auth/callback`,
  `auth/username` (signup availability check).
- Cron (Bearer `CRON_SECRET`): `cron/lock`, `cron/score`, `cron/notify`,
  `cron/detail` (backfill/finalize detail for **both** soccer + F1).

**Cron:** `supabase/cron-setup.sql` (pg_cron + pg_net) — **deferred until
go-live**; jobs `ll-lock` / `ll-score` / `ll-notify` / `ll-detail`. Not active in
prod yet (detail is currently populated on-demand + via manual backfill runs).

**Deploy:** GitHub Actions (`.github/workflows/deploy.yml`) gated on lint+tests;
manual `npx vercel deploy --prod --token $VERCEL_TOKEN`. Prod:
`https://liveleague-omega.vercel.app`.

---

## Log

### 2026-06-30 — Penalty shootout capture (totals + per-kick)
- **Totals** (`espn-soccer.ts` → `normalize.ts` → core `ApiMatch.pens`): parse the result
  note ("X advance 4-3 on penalties"), orient to home/away via the competitor `winner`
  flag, store flip-aware on the match, surface as `ApiMatch.pens` ({home, away} | null).
- **Per-kick** (`espn-summary.ts` `MatchDetail.shootout`): the summary endpoint's
  `shootout[].shots[]` (player, didScore) normalized per side + tallies — drives the
  green/red dot strip.
- Tests: `normalize.test.ts` (pens store + flip + non-shootout), `espn-summary.test.ts`
  (shootout normalization).

### 2026-06-29 — Resolve knockout matchups from the live feed (no more stale "2A v 2B")
- **Problem:** knockout slots ship as placeholders ("2A", "1F", "W74", "3rd …") and
  `applyEvents` matches by team pair, so once the real matchups were decided the bracket
  stayed stale. Our static bracket structure also doesn't mirror FIFA's real draw, and
  shootout winners can't be read off the score → the live feed is the only reliable source.
- **Fix:** new `apps/web/lib/resolve-knockouts.ts` — `resolveKnockoutTeams()` matches each
  placeholder knockout slot to its ESPN event by **venue + nearest kickoff** (±2 days) and
  copies in the real teams; then `applyEvents()` fills the score by team pair. Cascades
  round by round as games are decided. Venue alias map handles ESPN renames (Estadio Azteca
  → "Estadio Banorte").
- **Plumbing** (`tsdb.ts`): `applyAll()` = applyEvents → resolve → applyEvents; `liveDates()`
  also polls upcoming/just-decided knockout days; `liveWindowActive` stays active while a
  nearby knockout slot is unresolved so the bracket fills promptly. Tests:
  `apps/web/tests/resolve-knockouts.test.ts` (7).

### 2026-06-26 — Master paywall switch (off) + overview carries all live games
- **`PAYWALL_ENABLED` flag** (`lib/gating.ts`, currently `false`) — single reversible
  switch. While off: `getEntitlements()` (`lib/entitlements.ts`) returns
  `{hasPersonal:true, hasPro:true}` so all `requirePersonal/requirePro` gates pass;
  `app/api/me` reports fully entitled; `app/api/soccer/winprob/[id]` skips the gate so
  win-prob is open to everyone (incl. anonymous). Stripe/webhook/entitlements tables
  and all gating code stay intact — flip to `true` to re-enable with no other changes.
- **Overview live games:** `lib/sports/overview.ts` now carries all live games
  (`topGames(b.games, max(3, liveCount+3))`) instead of a fixed top-3, so the home
  "Live now" section and ticker never truncate simultaneous live matches.

### 2026-06-26 — Real win-probability model (Elo + Poisson + in-play), bundle-gated
- **Model:** new `lib/win-prob.ts` — pure, deterministic, unit-tested. Elo
  (`computeRatings`, seeded + replayed over finished results) → Poisson/Dixon–Coles
  goals matrix (`matchProbabilities`) → W/D/L + most-likely scoreline, plus a live
  `inPlayProbabilities` that scales by `remainingFraction(minute)` and shifts by the
  current score. Constants are calibrated, not trained (no free training corpus).
- **Seed:** new `data/eloRatings.ts` — static public pre-tournament Elo (~48 teams) +
  `DEFAULT_ELO` + `HOST_CODES` (USA/MEX/CAN get the only home-field bump). Same
  free-data pattern as `teams.ts`.
- **Route + gate:** new `app/api/soccer/winprob/[id]/route.ts` — `requirePersonal()`
  is the real enforcement (403 for free/non-entitled); reads the soccer `data_cache`,
  computes ratings, returns `WinProb` (live vs pre-match). Placeholder teams → 404.
- **Why:** the $5-bundle "live win probability" was seeded-random nonsense; this is a
  genuine, transparent, free-data estimate (labelled a model estimate, not odds).
- **Tests:** `tests/win-prob.test.ts` (12) — prob sums, favourite ordering, host edge,
  zero-sum Elo updates, chronological replay, in-play late-lead/late-deficit.

### 2026-06-26 — Real auth (Google + email), real form/H2H, unified match page
- **Auth (real Supabase):** rewrote `components/design/auth/authClient.ts` from a
  mock to the real browser client — email/password, Google OAuth (redirect via
  `/auth/callback`), username, `getSession`/`signOut`. `0012_username.sql`
  (`profiles.username` unique) + `handle_new_user` now sets username/display_name
  from signup metadata. `app/api/auth/username` (admin) backs the live
  availability check. The shell already reflects the real session via `useAuth`.
- **Real match data:** `lib/espn-summary.ts` `MatchDetail` gains `form`
  (`lastFiveGames`, W/D/L + score + opp, home/away-aware) and `h2h`
  (`headToHeadGames`, real home/away codes). Stored in `match_details`
  (re-backfilled). `matchData.ts` trimmed to the win-prob placeholder (+ team-page
  form); recent form / H2H / stakes are now real (stakes from `group-scenarios`).
- **Why:** turn Varun's mock seams into real backend; one canonical match page.

### 2026-06-26 — Soccer fixes (pass accuracy, venue) + pin-favourite-match
- **Pass accuracy** — `lib/espn-summary.ts` now derives it from
  `accuratePasses/totalPasses` (ESPN's `passPct` is an unreliable 0–1 fraction
  that rendered as "1%"). Re-backfilled all stored soccer details.
- **Venue** — capture ESPN's (current/sponsored) venue name into the match
  (`RawEvent.venue` → `applyEvents` sets `m.ven`; ESPN scoreboard parser sets it).
  One-off resync via `POST /api/cron/detail?venues=1` corrected **31** stale
  snapshot venue names in the soccer cache.
- **Pin favourite match** — `0011_pinned_match.sql` (`profiles.pinned_match`).
  `app/api/me/pin` (set/clear, own-row RLS); `/api/me` returns `pinnedMatch`;
  `useEntitlements` exposes `pinnedMatch` + optimistic `setPin`. Signed-in only.

### 2026-06-25 18:24 EDT — Race Center: rich F1 race detail (Jolpica)
- **New source** — `lib/jolpica-race.ts`: pure `normalizeRace` + `fetchRaceDetail`
  build a `RaceDetail` (full classification with grid→finish, points, DNF via
  Ergast `positionText`; fastest lap; qualifying Q1/Q2/Q3; pit-stop summary with
  `M:SS` duration parsing).
- **Storage** — reuses `match_details` (rows keyed `f1-<round>`, `espn_event_id`
  null). `app/api/f1/race/[id]`: DB-first; finished races immutable, else fetch +
  upsert. `app/api/cron/detail` extended with an F1 pass (backfills finished
  rounds). Ran it → rounds 1-7 stored.
- **Why:** the F1 analogue of the soccer Match Center, post-session (no live
  lap-by-lap on the free tier). Rendered in a popup on the F1 board.

### 2026-06-25 18:10 EDT — Backfill / finalize match detail
- **`app/api/cron/detail`** (Bearer `CRON_SECRET`): for every finished soccer
  match without a stored `ft` detail, resolve the ESPN event id (one scoreboard
  fetch per date, shared) → `fetchMatchDetail` → upsert `match_details`.
  Idempotent + capped (40/run). Ran it now → all finished matches (56) stored, so
  past games load instantly from the DB (no first-viewer fetch). Added `ll-detail`
  (every 10 min) to `cron-setup.sql` for ongoing finalization.

### 2026-06-25 17:51 EDT — Match Center: rich per-match detail (ESPN summary)
- **New source** — `lib/espn-summary.ts`: ESPN free `summary` endpoint →
  `normalizeSummary` (pure, unit-tested) builds a `MatchDetail` (goals/cards/subs
  with scorer names + descriptions, 9 curated team stats, real lineups +
  formation, venue/attendance/referee).
- **Storage** — `0010_match_details.sql` (`match_details` table, service-role
  only). `app/api/soccer/match/[id]`: DB-first; resolves the ESPN event id from
  the soccer cache (with a scoreboard-by-date fallback for pre-feature matches),
  fetches the detail on demand, and upserts it. Finished matches are stored once
  (immutable) so past games are browsable straight from the DB; live matches
  refresh on a short cache.
- **Threading** — `Match.espnId` / `RawEvent.espnId`; `applyEvents` copies it, the
  ESPN scoreboard parser sets it (`lib/espn-soccer.ts`).
- **Why:** a real, descriptive match center for live + historical games (replaces
  the disabled sample formation/win-prob).

### 2026-06-21 — DEV-only demo-live seam (no new fetch, no prod impact)
- **New `components/design/demoLive.ts`** — the integration seam for "is anything live?".
  `withDemoLive(ov, now)` optionally injects ONE fake live soccer match (minute/score derived
  from `now`) at the front of soccer's `topGames`; `useDemoNow()` ticks 1s only when the flag is
  on. All fake values live here — components just call `withDemoLive` at the read boundary, so
  partner's real live data will drive the same live UI with zero component changes.
- **Flag** — `DEMO_LIVE = DEMO_LIVE_FORCE || NEXT_PUBLIC_LL_DEMO_LIVE === "1"` (default OFF). When
  OFF, `withDemoLive` is identity and `useDemoNow` returns 0 (no interval) → production unchanged.
- Reads the existing `["overview"]` query (`useOverview` / `useLiveTicker`) — **no new fetch, no
  new route, no data-source change.** Not wired to any server code.

### 2026-06-19 22:10 EDT — Tighten auto-refresh cadence (no manual refresh)
- **Adaptive client poll intervals** sped up — `lib/polling.ts`: live `15s→12s`,
  soon `60s→30s` (and the "soon" window widened 30m→60m before kickoff), idle
  `5m→2m`. Standings poll `60s→30s` (`hooks/useMatches.ts`).
- **ESPN live revalidate** `15s→10s` in `refreshLive`/`refreshFull` (`lib/tsdb.ts`)
  so each poll returns fresher live scores.
- **Why:** users had to refresh manually; the 5-min idle interval made the board
  feel static. Now it self-updates within ~12s live / ~2m idle.

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
