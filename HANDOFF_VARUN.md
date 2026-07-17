# HANDOFF — Varun taking over dev (2026-07-08)

Ayush is handing off active development to Varun for a while. This doc is the
single starting point: what state the repo is in, what accounts you need, how
to get a local + on-device demo running, what's currently broken, and what's
next. Pair with **CLAUDE.md** (project rules/conventions), **FRONTEND.md** /
**BACKEND.md** (newest-first change logs), and **docs/** (deep-dive plans).

Read this doc top to bottom once, then use it as a reference.

---

## 0. TL;DR

- Web app (`apps/web`) and mobile app (`apps/mobile`) live in one Turborepo
  monorepo (npm workspaces, **not** pnpm), sharing pure-TS logic + data hooks
  via `packages/core` (`@liveleagues/core`).
- Mobile has **real screens** now (Home, World Cup, F1, match/race detail) —
  ported and built out this week. It's **offline-resilient** (bundled snapshot
  fallback) but its **default live-data URL is currently a dead deployment** —
  see Known Issue #1 (that's Ayush's to actually fix; there's a small
  mobile-side polish item in it for you too).
- Latest work is on branch **`integrate/mobile-frontend`**, already pushed with
  an open PR: **https://github.com/Varun-C07/liveleague/pull/1**. `main` does
  NOT have this work yet — review/merge that PR as your first action.
- Product is renamed **"LiveLeagues"** (bundle id / EAS project keep the legacy
  `liveleague` slug — only the display name changed).
- **Your scope is mobile** (`apps/mobile` + whatever backend it touches —
  Supabase auth, predictions, etc.). The web app / Vercel deployment stays
  with Ayush — you don't need Vercel access and shouldn't need to touch
  `apps/web` deploy config. See the access table and Known Issue #1 below for
  how that affects local testing.

---

## 1. Get access (do this first)

| System | Status | Action |
|---|---|---|
| **GitHub** — `github.com/Varun-C07/liveleague` | You already own this repo. | `gh auth login` as yourself if not already authenticated locally. |
| **Expo/EAS** — `@varunchs-team/live-league` | You already own this account. | `npx eas-cli@latest login` (your Expo account). |
| **Apple Developer / App Store Connect** — team `34Y6654R5M`, bundle `com.liveleague.app`, ASC App ID `6787629770` | **You already have the `.p8` API key** (Key ID `AX76HMF5Y6`) — no transfer needed. | Just make sure the key file is at the path referenced in `apps/mobile/eas.json` (`ascApiKeyPath`) on **your** Mac before running `eas build`/`eas submit` — that field is currently an absolute path pointing at Ayush's machine (`/Users/ayushch/keys/...`); update it to your own local path (see Known Issue #1a). |
| **Supabase + Stripe** | Per project convention (CLAUDE.md) you already own backend infra as the original backend owner. | Confirm you can still log into both dashboards; if not, get Ayush to re-invite you (standard dashboard "invite member" flow — normal SaaS access, no secret-sharing needed). Mobile auth will eventually call this directly. |
| **Vercel / web deploy** | **Not your concern.** You're scoped to mobile — the web app and its Vercel deployment stay with Ayush. | Nothing to set up. For local mobile testing you don't need Vercel at all — see §5 for running a local backend instead. |

---

## 2. Pull latest and install

```bash
git clone https://github.com/Varun-C07/liveleague.git
cd liveleague

# The real mobile frontend work is NOT on main yet — it's on a branch with an
# open PR (https://github.com/Varun-C07/liveleague/pull/1). Review it, then
# either merge it yourself or ask Ayush to. To pull it locally right now:
git fetch origin
git checkout integrate/mobile-frontend
# (once merged, `git checkout main && git pull` is enough going forward)

npm install          # installs all workspaces (root, apps/web, apps/mobile, packages/core)
```

Node version: whatever `apps/web`/`apps/mobile` expect (Node 20+ recommended;
check `.nvmrc` if present, otherwise use your latest LTS).

## 3. Environment variables

```bash
cp apps/web/.env.local.example apps/web/.env.local
```

Fill in `apps/web/.env.local` from your Supabase/Stripe dashboards (see access
table above). Sports-feed vars (`TSDB_*`, `JOLPICA_BASE`) are optional —
snapshot fallbacks exist. Supabase/Stripe vars are required for
auth/payments/predictions to work locally.

Mobile reads `EXPO_PUBLIC_API_URL` (see Known Issue #1) — set it per the local
dev instructions below.

## 4. Run the web app locally

```bash
npm run dev:web     # http://localhost:3000
```

Or from repo root, `npm run dev` runs everything through Turbo (web + mobile
Metro together) — usually you want just one at a time, so prefer `dev:web` /
`dev:mobile`.

## 5. Run the mobile app (real device — Expo Go will NOT work)

**Important:** the app is on **Expo SDK 56**, which is newer than any
published App Store "Expo Go" build. Expo Go will report the project as
incompatible even if Expo Go itself is up to date. You need a **development
build (dev client)** instead — one-time setup, then hot reload like normal.

Before your first build, fix the `.p8` key path — `apps/mobile/eas.json`
`submit.production.ios.ascApiKeyPath` is currently an absolute path on Ayush's
Mac (`/Users/ayushch/keys/asc-key/AuthKey_AX76HMF5Y6.p8`). Put your copy of the
key somewhere on your Mac and update that path to match (don't commit the key
file itself — it's already gitignored, just double-check).

```bash
cd apps/mobile

# One-time: register your iPhone with EAS (open the printed link ON the phone)
npx eas-cli@latest device:create

# One-time: build + install the dev client (~15 min, cloud build via EAS).
npx eas-cli@latest build --platform ios --profile development-device
# → open the build's install link on your iPhone when it finishes

# Every day after that: just start Metro and open the dev-client app on your phone.
npx expo start --dev-client
```

To point the app at a **local** web server instead of the (currently dead)
default prod URL:

```bash
# in one terminal, from repo root:
npm run dev:web

# in another terminal, find your Mac's LAN IP (System Settings → Wi-Fi → Details),
# then from apps/mobile:
EXPO_PUBLIC_API_URL=http://<your-LAN-ip>:3000 npx expo start --dev-client
```

Your phone and Mac must be on the same Wi-Fi network for this to work.

**If routing changes don't seem to take effect** (e.g. you edit a `_layout.tsx`
or add a route file and nothing changes): expo-router caches its route
manifest and Fast Refresh does NOT rebuild it. Restart Metro with `--clear`
and **fully quit and reopen** the dev-client app on the phone (not just
background it).

---

## 6. Known issues (fix these first)

1. **Mobile's default live-data URL is dead.** `apps/mobile/src/lib/apiBase.ts`
   defaults `EXPO_PUBLIC_API_URL` to `https://live-league.vercel.app`, which
   404s on all `/api/*` routes (that deploy predates the monorepo move and was
   never repointed at `apps/web`). The app **does not crash** — it falls back
   to bundled snapshots (`@liveleagues/core/snapshots`) and shows an honest
   **SAMPLE** pill on Home — but World Cup/F1 tabs don't yet show that same
   pill (inconsistent — worth fixing while you're in there, this part IS
   yours). The underlying fix (standing up a working deployed backend) is
   **Ayush's side, not yours** — ask him when a stable URL is ready, then just
   update the default in `apiBase.ts`. Day to day, don't wait on that: run
   `npm run dev:web` yourself and point `EXPO_PUBLIC_API_URL` at your Mac's
   LAN IP (§5) for live data while developing.

   **1a.** `apps/mobile/eas.json` → `submit.production.ios.ascApiKeyPath` is
   an absolute path on Ayush's Mac — update it to wherever you put your copy
   of the `.p8` key (see §1) before running `eas build`/`eas submit`.

2. **`apps/mobile/tsconfig.json` gets auto-edited.** Running `expo start` or
   `expo export` sometimes strips `.expo/types/**/*.ts` and `expo-env.d.ts`
   from the `include` array. If typecheck suddenly breaks after running an
   Expo command, `git diff apps/mobile/tsconfig.json` and restore those two
   lines if they're missing (`.expo/types/**/*.ts`, `expo-env.d.ts`) before
   committing.

3. **`.github/workflows/deploy.yml` isn't monorepo-aware.** It predates both
   the npm-workspaces/Turborepo conversion (Phase 0) and this mobile work.
   This is **web/deploy, Ayush's side** — not something you need to fix,
   included here just so you're not confused if you notice CI looking stale.

4. **TestFlight tester invite for `ayushch6301@gmail.com` is unresolved.**
   Ayush wanted to add themselves as a tester on the app. An automated
   App Store Connect API invite was attempted and blocked (a DEVELOPER-role
   grant is more than "add a tester" and needs a human to do it deliberately).
   Once you have ASC access, do this manually in App Store Connect → your app
   → TestFlight → either add as an internal tester (if they're a team member)
   or an external tester (needs one-time Beta App Review, ~24h).

5. **Mobile auth is a no-op stub.** `apps/mobile/src/providers/auth.tsx`
   returns `{ user: null, signIn: () => {}, signOut: () => {} }` by design —
   clearly commented as a seam. Real auth (Supabase native + deep-link OAuth,
   plus **Sign in with Apple**, which Apple requires before any App Store
   submission that has other social sign-in) is not built yet. See backlog.

6. **Match/race detail pages are honest placeholders.** `match/[id].tsx` and
   `race/[id].tsx` render a real card + meta line, but Lineups/H2H/Win-prob
   (soccer) and Results/Standings-impact (F1) sections say "Coming soon" —
   no fake data, just not built. Web's `/api/soccer/match/[id]` (ESPN summary
   data) exists but coverage is spotty for 2026 World Cup fixtures — verify
   data availability before assuming this is a quick port.

---

## 7. Bundled snapshots — how they work, how to regenerate

`packages/core/src/snapshots/` holds frozen, sanitized copies of `/api/live`,
`/api/soccer`, `/api/f1`, and `/api/soccer/standings`, captured from a real dev
server. Mobile screens seed their React Query hooks with these
(`useLiveTicker(OVERVIEW_SNAPSHOT)` etc., `staleTime: 0` on the mobile
QueryClient) so every screen renders instantly and never goes blank — a live
fetch always fires on mount and replaces the snapshot the moment it succeeds.

These will go stale as the World Cup progresses (e.g. once the real bracket
fills in). To regenerate:

```bash
# 1. Start the web dev server
npm run dev:web

# 2. Capture the four endpoints
curl -s http://localhost:3000/api/live            -o /tmp/snap-live.json
curl -s http://localhost:3000/api/soccer          -o /tmp/snap-soccer.json
curl -s http://localhost:3000/api/f1              -o /tmp/snap-f1.json
curl -s http://localhost:3000/api/soccer/standings -o /tmp/snap-standings.json
```

Then transform each into the matching `packages/core/src/snapshots/*.ts` file:
set `source: "snapshot"` (and `reason: "sample"` on the overview/bundle files),
zero out `liveCount`/`totalLive`, and demote any `status: "live"` game to
`"final"`/`"ft"` (a frozen snapshot must never claim to be live — that's what
keeps the SAMPLE-vs-LIVE labelling honest). Export each as a typed const and
re-export from `packages/core/src/snapshots/index.ts`. This should become a
real script (see backlog) instead of a manual step — there isn't one checked
into the repo yet.

---

## 8. What's next — backlog

Work through issues in §6 first; below is the broader roadmap. You're covering
both frontend and backend now, so this list isn't split by role — pick what's
highest-impact.

### Mobile frontend
- **Real auth**: Supabase native auth (deep-link OAuth) + **Sign in with
  Apple** (hard App Store requirement). Then build out the **Profile** tab
  (currently a stub with a dead Sign-in button).
- **Real detail-page content**: lineups/H2H/win-prob on `match/[id]`,
  results/standings-impact on `race/[id]` — check data availability first
  (see Known Issue #6).
- **Predictions / friend leagues / follows on mobile** — these exist on web
  (Supabase-backed) but have no mobile UI yet.
- **Turn snapshot regeneration into a real script** (`npm run
  snapshot:refresh` or similar) instead of the manual steps in §7.
- Consistent **SAMPLE pill** across World Cup/F1 tabs (currently only Home has
  it — see Known Issue #1).
- Re-enable `typedRoutes` in `apps/mobile/app.json` (off since the initial
  scaffold); add `eslint-config-expo` (mobile is currently excluded from the
  Turbo lint pipeline).
- Push notifications (OneSignal is wired on the backend side already —
  `NEXT_PUBLIC_ONESIGNAL_APP_ID` / `ONESIGNAL_REST_API_KEY` — no mobile
  client wiring yet).

### Web frontend
- Home: adaptive live hero for when 2–3+ matches are live at once (currently
  only spotlights one).
- Soccer: team-profile route, player-profile route, knockout bracket visual.
- Fix any stale SAMPLE win-prob showing wrong team names on the featured card
  (flagged as a known follow-up in CLAUDE.md — verify still reproducible).

### Backend / infra
*Web deploy items below are Ayush's, listed here only for context — not
blocking your mobile work.*
- ~~Fix `deploy.yml` for the monorepo~~ / ~~stand up a real Vercel
  deployment~~ (Known Issue #1) — Ayush's side.
- Mobile-relevant backend: wiring Supabase auth for mobile (deep-link OAuth),
  Sign in with Apple, push notifications (OneSignal is already wired
  server-side) — these ARE yours, see Mobile frontend above.
- Traffic/analytics (visitor counts, web + mobile) — not implemented; see
  `docs/MOBILE_DEPLOYMENT_PLAN.md` for the PostHog-based plan Ayush drafted.
- Observability (Sentry or similar) — not implemented.
- `packages/api-client` extraction (typed fetch layer shared by web/mobile,
  currently each hook hand-rolls `fetch` + `res.json()`) — deferred, nice to
  have.
- CI e2e tests (Maestro was the plan for mobile) — not started.

### ML / predictions (bigger, separate effort)
- The original plan (`docs/VARUN_MOBILE_AND_ML_PLAN.md` Part B) covers a
  Kalshi/betting-style match-outcome + prop-prediction model using live data +
  scraped historical data. Not started. Read that doc before scoping — it has
  the full data-source and architecture thinking already.

---

## 9. Where to find more context

- **CLAUDE.md** — the ground-truth project rules (design system, "which UI
  system is live vs dormant," backend seam conventions, working cadence).
  Read this before touching `components/design/` on web — there's a dormant
  parallel UI tree (`components/shell/`, `components/home/`) that looks live
  but isn't rendered; editing it is a documented trap.
- **FRONTEND.md** / **BACKEND.md** — newest-first change logs. Skim the top
  few entries of each for the most recent context beyond this doc.
- **docs/PHASE_0_MONOREPO.md** — why/how the repo became a monorepo.
- **docs/PHASE_2_MOBILE_SCAFFOLD.md** — the original Expo scaffold notes.
- **docs/MOBILE_DEPLOYMENT_PLAN.md** — Ayush's full deploy/infra/security/
  payments/traffic plan for shipping to the App Store.
- **docs/VARUN_MOBILE_AND_ML_PLAN.md** — your original two-part plan (mobile
  frontend + ML prediction model) — Part B (ML) is still fully open.
- **PR #1** (https://github.com/Varun-C07/liveleague/pull/1) — the actual diff
  for everything described in this doc; read the commit messages in order,
  they narrate the reasoning (why things were ported vs. rebuilt, why the
  package was renamed, why the 404 bug took two tries to actually fix, etc).
