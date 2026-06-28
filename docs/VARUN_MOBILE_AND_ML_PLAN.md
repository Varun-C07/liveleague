# Varun's Plan — Mobile Frontend + Match-Prediction ML Model

> **Audience:** Varun. Two jobs: **(A)** build the React Native (Expo) mobile frontend for Live
> League, and **(B)** build a match-prediction ML model (à la Kalshi/betting platforms) that powers
> engaging predictions in the app.
>
> **Companion doc:** `docs/MOBILE_DEPLOYMENT_PLAN.md` — Ayush's deployment/infra/payments/store plan.
> Read its §1 (architecture) and §6 (security) first; they define the boundaries you work within.

---

## How to read this doc
- **Part A** = mobile frontend (your primary day-to-day).
- **Part B** = the ML prediction model (a parallel track; can start in week 1 since it's independent).
- Everything assumes the **monorepo** Ayush sets up: `apps/web` (existing), `apps/mobile` (yours),
  `packages/core` (shared pure-TS logic), `packages/api-client`, `services/ml` (your Python model).

---

# PART A — Mobile Frontend (React Native / Expo)

## A.0 Decisions you're building under (don't re-litigate these)
- **Stack:** Expo (managed) + **expo-router** (file-based navigation).
- **iOS first**, Android on the roadmap — so write **cross-platform code** (no iOS-only hacks).
- **Evolve the existing design language** (Obsidian dark, *scarce* lime accent, sport colors,
  Saira Condensed + Inter) — rebuilt with **native mobile patterns**, not a copy of the web layout.
- **Reuse the data layer.** The win-prob model, scoring, types, normalization, polling, and the
  TanStack Query hooks are **already written and tested** — you import them, you don't rewrite them.

## A.1 Where you work (and where you must NOT touch)
| Do your work in | Leave alone |
| --- | --- |
| `apps/mobile/**` — your entire app | `apps/web/**` — Ayush/the web app (don't break it) |
| `packages/core` — **only** to add shared pure-TS logic both apps need (with Ayush's review) | `services/` infra owned by Ayush except `services/ml` (yours) |
| `services/ml/**` — your Python model | `app/api/**` (now `apps/web/app/api`) — backend routes; request changes via Ayush |

**Rule:** if a piece of logic is *pure TypeScript and both web + mobile need it*, it belongs in
`packages/core`, not copied into `apps/mobile`. Copying logic is the #1 way the two apps drift. When in
doubt, ask before duplicating.

## A.2 Code-management best practices (non-negotiable for a clean codebase)
1. **Branch + PR per feature.** Never push to `main`. Branch from `main`, e.g.
   `mobile/home-screen`, `ml/elo-v1`. Open a PR; Ayush reviews. Keep PRs small and single-purpose.
2. **CI must be green before merge:** typecheck, lint, and the `packages/core` Vitest suite all pass
   (GitHub Actions runs them — see Ayush's doc §10). Don't merge red.
3. **Conventional commits** (`feat:`, `fix:`, `chore:`, `refactor:`) — keeps history readable and
   matches the repo's existing change-log discipline.
4. **Keep the change logs current** (the repo convention): UI change → top entry in `FRONTEND.md`;
   backend/data change → `BACKEND.md`. Newest-first, short: what / where / why.
5. **Talk to the seams, not the internals.** Auth → the `authClient` interface. Payments → the
   `Purchases` seam. Predictions → the API client. Never scatter `fetch()` calls or mock values
   across components — this is already the repo's rule (CLAUDE.md "BACKEND SEAMS").
6. **Types are shared.** Import `Game`, `Match`, `WinProb`, `Entitlements`, etc. from `packages/core`.
   Don't redefine them in mobile — a single source of truth prevents silent shape mismatches.
7. **No secrets in the app.** Only public keys (Supabase anon, PostHog client, Sentry DSN). See
   Ayush's doc §6.1. Session tokens go in **`expo-secure-store`** (Keychain), never AsyncStorage.
8. **Write tests for new pure logic** in `packages/core` (Vitest). Inject `now`/params instead of
   `Date.now()` so tests are deterministic — same rule the repo already follows.

## A.3 The reuse map (what you get for free)
Ayush's exploration found **~35% of the code is portable pure TS.** You consume it; you don't rebuild
it. Concretely:

| You reuse (from `packages/core` / `packages/api-client`) | You rebuild natively (web-only today) |
| --- | --- |
| Types: `Game`, `Match`, `WinProb`, `StandingRow`, `Entitlements`, DTOs | All screens & components (inline web styles → RN) |
| `win-prob.ts` (Elo + Poisson model) | `theme.tsx` → an RN theme/StyleSheet equivalent |
| `scoring.ts`, `standings.ts`, `format.ts`, `normalize.ts`, `polling.ts` | `GlobalStyle.tsx` (CSS keyframes) → Reanimated |
| `favorites.ts`, `schedule.ts`, group/F1 scenarios | `DesignShell.tsx` (nav/ticker) → bottom tabs + RN ticker |
| TanStack Query hooks (`useOverview`, `useMatches`, `useStandings`, `useWinProb`, `usePredictions`, `useLeagues`) — **work in RN unchanged** | Animations (`framer-motion`/`motion`) → `react-native-reanimated` |
| `authClient` interface (Supabase SDK works in RN; only OAuth redirect changes) | Icons (`lucide-react`) → `react-native-svg` icons |
| `api-client` (the typed `/api/*` surface) | localStorage hooks → `AsyncStorage`/`SecureStore` |

**Hooks that need small RN adaptations** (replace web APIs, keep the logic):
`useFavorites`/`usePrefs` (localStorage → AsyncStorage), `useAuth` (OAuth redirect → deep link),
`useNotifications` (web Notification → `expo-notifications`), `useGoalFlash`/`useScoreFlash` (DOM →
Reanimated). These are wrappers — the underlying data logic is in `core`.

## A.4 App architecture (expo-router)
Mirror the web's three-screen surface, but with **native navigation**:

```
apps/mobile/app/
  _layout.tsx              # root: providers (QueryClient, Theme, Auth, PostHog, Sentry)
  (tabs)/
    _layout.tsx            # bottom tab bar:  Home · World Cup · Formula 1  (+ Profile)
    index.tsx              # Home  (live hero + ticker + live-now list)
    soccer.tsx             # World Cup
    f1.tsx                 # Formula 1
    profile.tsx            # account / sign-in / follows / leagues
  match/[id].tsx           # soccer match detail — a REAL route (deep-linkable, back works)
  team/[code].tsx          # team profile
  race/[id].tsx            # F1 race detail
  league/[id].tsx          # friend league
```

> **Why real routes, not modals:** CLAUDE.md's known follow-ups call for match/team/race as real
> routes so **back, share, and deep-link work natively.** expo-router gives you this for free — use
> it. Deep links (`liveleague://match/123`) also power push-notification taps.

**Native patterns to adopt (this is what makes it feel like an app, not a website — and avoids Apple's
"it's just a webview" rejection):**
- **Bottom tab bar** for the three sports + profile (not the web's pill nav).
- **Pull-to-refresh** on every list (ties to the existing polling/refetch).
- **Native bottom sheets** for filters/share (e.g. `@gorhom/bottom-sheet`).
- **Swipe gestures**, large **44pt+ touch targets**, native momentum scrolling.
- **Skeleton loaders** + explicit empty/error states for every data screen (the data layer already
  returns a `reason`: `live`/`empty`/`fallback`/`sample` — surface it honestly, never say "Offline").
- **Safe-area aware** layouts (notch / home indicator) via `react-native-safe-area-context`.

## A.5 Styling: porting the design language
- **Don't use the web's inline `style={{}}` + CSS.** Use **React Native `StyleSheet`** (or
  **NativeWind** if you prefer Tailwind-style classes — your call, but be consistent).
- **Port the theme object.** Recreate the `Obsidian` palette (and the others) as a typed RN theme
  consumed via a `ThemeProvider`/context — same idea as web `theme.tsx`, so `t.accent`, `t.text`,
  `t.surface` still drive everything and nothing hardcodes hex. This keeps theme-switching working.
- **Keep the design rules** (from CLAUDE.md — match them exactly):
  - **Accent (lime) is scarce** — primary CTA + the genuine live signal only. Don't spray it.
  - **F1 = red, World Cup = green/accent.** F1 cards lead with round number (`R8`) in display font,
    no sport icon. Soccer cards use **country flags** (port the SVG flag set to `react-native-svg`),
    no sport icon.
  - **Cards:** dark surface, left accent bar in the sport color, subtle hover/press lift, no clip-art.
  - **Premium money surfaces:** restrained **gold**, price as focal point — never the cheap yellow
    box. Paid features **teased** (locked/behind-glass), not hidden.
  - **Section headers:** accent bar + uppercase display label, used identically everywhere.
- **Fonts:** load **Saira Condensed** (`.disp` headers) + **Inter** (body) via `expo-font`.
- **Motion (Reanimated):** restrained, event-driven, 150–450ms ease-out, **respect reduced-motion**.
  The live pulse/score-flash is **driven by the data layer's live signal**, not hardcoded — so real
  live data lights it up with zero component changes (same principle as web). No count-ups, no
  decorative loops.

## A.6 Data fetching on device
- Wrap the app in a **TanStack Query `QueryClientProvider`** (already a dependency, works in RN).
- The existing hooks (`useOverview`, `useMatches`, `useWinProb`, …) call the **same `/api/*` routes on
  Vercel** through `packages/api-client`. On mobile, requests carry the **Supabase JWT as a Bearer
  token** (Ayush wires the server side). You just pass the session token from the auth context.
- Respect the existing **adaptive polling** (`lib/polling.ts`: ~15s live → 5m idle). Consider pausing
  polling when the app is **backgrounded** (`AppState`) to save battery/quota.
- Use the **DEV demo-live flag** (already in the data layer) to verify live UI when nothing's truly
  live — it must stay **default OFF**.

## A.7 Auth on mobile (the ~20% that differs from web)
- Supabase JS SDK works in RN — reuse `authClient`'s logic. The change is the **OAuth redirect**:
  use `expo-auth-session` / Supabase native OAuth with a deep-link scheme
  (`liveleague://auth-callback`) instead of the web's `window.location`.
- **Implement "Sign in with Apple"** — Apple *requires* it because the app offers Google sign-in
  (`expo-apple-authentication`). Skipping it = guaranteed App Store rejection.
- Persist the session in **`expo-secure-store`** (Keychain) — configure it as the Supabase client's
  storage adapter. Never store tokens in plaintext AsyncStorage.

## A.8 Payments seam (beta = free; just build the seam)
- Beta ships with features **unlocked** (`PAYWALL_ENABLED` is off). Don't wire real IAP yet.
- Build the `Purchases` seam interface in `packages/core` (`getOfferings`, `purchase`, `restore`,
  `getEntitlements`); the beta implementation returns "all unlocked." Production swaps in
  **RevenueCat** (Ayush's doc §7). Your UI reads entitlements from the existing `entitlements`/`gating`
  types — **don't gate features with ad-hoc booleans**; go through the seam.
- Still design the **premium teasers** (locked/behind-glass with price) now — they're UI, and they're
  what convert later.

## A.9 Build/run loop (your daily workflow)
1. One-time: `eas build --profile development` → install the **dev client** on your iPhone.
2. Daily: `npx expo start` → fast refresh on device. No cloud build per change.
3. JS-only fixes for testers ship via **EAS Update** (OTA) — no new TestFlight build needed.
4. Native changes (new native lib, new permission) require a fresh `eas build`.
5. Before PR: `pnpm lint && pnpm typecheck && pnpm test` (core) locally; write/update tests.

## A.10 Android readiness (write it in now, ship it later)
Even though iOS is first, **don't write iOS-only code**:
- Use Expo's cross-platform APIs (don't reach for native iOS modules without an Android path).
- Handle the **Android hardware back button**, status-bar color, and edge-to-edge insets.
- Test density/fonts mentally for Android; keep touch targets generous.
- Push: code against **`expo-notifications`** (Expo routes APNs *and* FCM) so Android "just works."

## A.11 Definition of done for a screen
A screen is "done" when: it reads from `packages/core` hooks (no duplicated logic) · has loading /
empty / error / `sample`-vs-`live` states · respects safe areas · matches the design rules in A.5 ·
works in light-on-dark with the theme object · has a Maestro smoke step · and a `FRONTEND.md` entry.

---

# PART B — Match-Prediction ML Model

> **Goal:** predictions that *intrigue users and give them a reason to open the app* — like
> Kalshi/betting platforms — **but framed as entertainment, not wagering** (no real-money betting, no
> payouts; see Ayush's doc §6.5). Start **statistical and honest**, grow to ML.

## B.0 Guiding principles
1. **Honesty over hype.** Free-data approximations, clearly labeled. We can't show licensed xG /
   official odds, so we show *transparent* models and say so. (CLAUDE.md's core data rule.)
2. **Calibration > accuracy.** A prediction that says "65%" should happen ~65% of the time. We measure
   this (Brier score, reliability curves), not just win/loss.
3. **Explainable first.** V1 is Elo + Poisson — every number is traceable. That builds user trust and
   makes debugging possible. ML (black-box-ier) comes after we have a baseline to beat.
4. **Reuse what exists.** `packages/core/win-prob.ts` is already an Elo + Poisson win-prob model with
   tests. **Don't start from scratch — extend it.** The Python service can mirror/extend its logic and
   eventually surpass it.

## B.1 Where the model lives (architecture)
- **`services/ml/`** — a standalone **Python (FastAPI)** service, its own venv/Docker, hosted on
  **Railway/Render** (Ayush's doc §12). It is **not** a JS workspace.
- **Two responsibilities:**
  1. **Offline training/backtesting jobs** (scheduled, e.g. daily) — train on historical data, write
     predictions for upcoming fixtures.
  2. **Serving** — write predictions to a **Supabase table** (`predictions_model`, keyed by
     `match_id` + `market`), and optionally a `/predict` endpoint for on-demand inference.
- **The app never calls Python directly.** It reads predictions through a thin Vercel route
  (`/api/predictions/model/[matchId]`) → Supabase. One auth + rate-limit boundary. Ayush wires that
  route; you define the **table schema** and **prediction contract** (a typed shape in
  `packages/core` so web + mobile render it identically).

## B.2 Data sources (free + scraping — approved)
| Source | What it gives | Use |
| --- | --- | --- |
| **football-data.co.uk** | Historical match results + closing odds (many leagues, years) | Core training data + odds baseline to calibrate against |
| **openfootball** (GitHub) | Open structured fixtures/results incl. World Cups | Tournament history, clean schemas |
| **FBref / StatsBomb open data** | Richer stats (some xG, shots) for select competitions | Feature enrichment (V2) — scrape respectfully, cache |
| **Kaggle datasets** (Intl football results 1872–present, WC datasets) | Long international history (great for a World Cup app) | National-team Elo, tournament priors |
| **Your live feeds** (TheSportsDB, Jolpica, ESPN) | Current-season fixtures/results, F1 data | Live features + the fixtures you actually predict |
| **football-data.org / API-Football free tier** | Current standings/fixtures (rate-limited) | Supplementary current-season signal |

**Rules:** respect robots.txt / rate limits when scraping; **cache raw pulls** to disk/Supabase so you
don't re-hit sources; store a **data provenance note** per dataset (license, date pulled). Keep raw →
cleaned → features as separate stages (don't train on un-versioned data).

## B.3 Build order (statistical → ML), with prediction "markets"

### V1 — Statistical baseline (ships first, explainable)
Markets to launch with (these are the "intriguing predictions" users see):
- **Match result** — Home / Draw / Away probabilities.
- **Over/Under goals** (e.g. O/U 2.5) — straight from the Poisson goal model.
- **Both Teams To Score (BTTS)** — also falls out of the goal model.
- **Correct score** (top-N most likely scorelines) — Poisson scoreline matrix.
- **F1:** podium / points-finish / "beats teammate" probabilities (extend the existing F1 scenarios
  logic in `core`).

Models:
- **Elo / Glicko ratings** per team (club + national), updated chronologically over the historical
  data. Tune K-factor, home advantage, and a **margin-of-victory multiplier**. National-team Elo is
  perfect for a World Cup app and you have 150 years of results (Kaggle).
- **Poisson / Dixon-Coles goals model** — expected goals per side from attack/defense strengths +
  home advantage; Dixon-Coles correction fixes Poisson's known under-count of low scores (0-0, 1-0,
  1-1). The scoreline matrix gives you result, O/U, BTTS, and correct-score **from one model**.
- This mirrors and extends `packages/core/win-prob.ts` — keep the TS version as the lightweight
  in-app fallback; the Python version is the richer trainer.

### V2 — Machine learning (beat the baseline)
- **Gradient-boosted trees (XGBoost/LightGBM)** for result/markets — they handle tabular football
  features well and stay relatively interpretable (feature importances, SHAP).
- **Features:** Elo diff, recent form (rolling points/goals, last-N), rest days, home/away, head-to-head,
  goal difference trends, (where available) xG, squad availability, tournament stage, and the
  **market odds** from football-data.co.uk as a strong feature/anchor.
- **Always compare to V1** on the same backtest — only promote a model that beats Elo/Poisson on
  Brier score *and* stays calibrated.

### V3 — Engagement markets (the "intrigue" layer)
- **Anytime goalscorer / first scorer** (needs player-level data — FBref/StatsBomb), **cards/corners**
  ranges, **player props**. Higher data cost; prioritize by what users engage with (PostHog tells you
  — Ayush's doc §9).
- **Live in-play win-probability updates** (the existing model already does an in-play update; extend
  it). This is the most "alive"-feeling feature.

## B.4 Evaluation (how we know it's good — do this from day one)
- **Backtest chronologically** (train on past, test on the *future* slice — never shuffle across
  time; that leaks the future).
- **Metrics:** **Brier score** (primary), **log-loss**, **reliability/calibration curve**,
  **accuracy** (secondary), and **vs-market** (does our prob beat/track closing odds after removing
  the bookmaker margin?).
- **Calibration plot** per market — if "70%" buckets don't land near 70%, recalibrate (Platt /
  isotonic).
- Keep a **leaderboard** of model versions in `services/ml/` so every change is measured against the
  last. Never ship a model that's worse than V1.

## B.5 Serving contract (so the app can render it)
Define a typed shape in `packages/core` (both clients import it):

```
ModelPrediction = {
  matchId: string
  sport: 'soccer' | 'f1'
  market: 'result' | 'ou_2_5' | 'btts' | 'correct_score' | 'f1_podium' | ...
  outcomes: { label: string; prob: number }[]   // probs sum ~1.0
  modelVersion: string
  updatedAt: string
  isSample: boolean        // free tier sees clearly-labeled SAMPLE; paid sees real
}
```

- Python writes rows → Supabase `predictions_model`. The app reads via the Vercel route.
- **Free vs paid:** free users get a **clearly-labeled SAMPLE** prediction; paid users get the real
  model output — gated by the existing `entitlements`/`gating`. The model supplies real numbers; the
  gating decides who sees them (CLAUDE.md's paywall rule).

## B.6 Responsible-AI / legal guardrails (must follow)
- **Entertainment, not gambling.** No real-money wagering, no payouts, no "place a bet" language.
  This keeps the app out of the gambling category and its store/legal scrutiny.
- **Label uncertainty.** Show it's a model/approximation, not a guarantee. Don't imply insider/edge.
- **No licensed data misuse.** Free/open sources only (approved); honor each source's license; cache
  rather than hammer. Document provenance.
- **Reproducibility.** Versioned data + versioned models + saved backtests, so any prediction shown in
  the app can be explained later.

## B.7 ML milestones
| Stage | Deliverable |
| --- | --- |
| M1 | `services/ml` scaffold; ingest + clean football-data.co.uk + Kaggle intl results; data versioned |
| M2 | Elo ratings (club + national) with chronological backtest + Brier baseline |
| M3 | Dixon-Coles goals model → result / O/U / BTTS / correct-score markets; calibration plots |
| M4 | FastAPI service writes `predictions_model` to Supabase; `ModelPrediction` contract in `core` |
| M5 | App surfaces predictions (free SAMPLE vs paid real) — coordinate with Part A |
| M6 | XGBoost/LightGBM V2 with form/odds features; promote only if it beats V1 on Brier |
| M7 | Engagement markets (scorers/props) + live in-play updates, prioritized by PostHog engagement |

---

## Your week-1 checklist
**Frontend track:**
1. Read this doc + Ayush's doc §1 (architecture) and §6 (security).
2. Get repo + App Store Connect access from Ayush; set up the local monorepo + Expo dev environment.
3. Once `packages/core` exists, scaffold `apps/mobile` (Expo + expo-router), get a dev build on your
   iPhone, render one screen (Home, read-only) from a `core` hook.

**ML track (parallel, independent of the app):**
4. Scaffold `services/ml`; pull + clean football-data.co.uk + a Kaggle international-results dataset;
   commit a data-versioning + backtest harness (Brier baseline) before any modeling.

**Process:**
5. Branch + PR for everything; keep CI green; log changes in `FRONTEND.md` / `BACKEND.md`.
```

