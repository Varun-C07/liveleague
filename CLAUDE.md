# CLAUDE.md — Live League

Context for Claude Code working in this repo. Pair with **README.md** (overview),
**ROADMAP.md** (timeline), **FRONTEND.md** + **BACKEND.md** (newest-first change logs).

## What this is
A single **Next.js 15 (App Router) / React 19 / TypeScript** app for live sports. The data
layer tracks five leagues, but the **live UI surfaces three screens: Home, World Cup soccer,
and F1.** Live data is server-proxied from **free** feeds (Jolpica F1, TheSportsDB soccer) with
per-sport snapshot fallbacks. The app is the repo root. Repo: `github.com/Ayush-Chaudhary/liveleague`.

Two-person team. **I (this collaborator) own the FRONTEND only.** My partner owns the BACKEND
(Supabase data + auth, Stripe payments). Work happens on branch `frontend-polish`; nothing is
pushed to `main` until deliberately opening a PR — that's how the partner integrates. So: build
front-end experiences with clean PLACEHOLDER SEAMS, never real backend wiring.

## ⚠️ Two UI systems — read this first
- **LIVE — `components/design/`.** This is what renders. Styles with **inline `style={{…}}`
  driven by the theme object `t.*`**, NOT Tailwind. Wired via `app/layout.tsx`. ALL visual work
  happens here.
- **DORMANT — do NOT edit unless explicitly reviving:** `components/shell/` (incl. old
  `AuthControl.tsx`), `components/home/`, `app/globals.css` `[data-sport]`/`var(--accent)` tokens,
  and the NBA/cricket/MLB/agenda routes. Still in the repo, not rendered. Editing these is the #1
  trap — changes won't show on screen.

### How to make a change show up on screen
**Start in `components/design/`.** Page body/layout → `components/design/screens/*` (or pieces in
`components/soccer/`, `components/f1/`). Nav/logo/Sign-in/ticker → `DesignShell.tsx`. Colors/themes
→ `theme.tsx`. Fonts/animations/breakpoints → `GlobalStyle.tsx`.

## Pages (loader → screen)
Each `app/.../page.tsx` is a thin data loader handing off to a screen owning the visuals:

| URL       | Loader               | Screen (edit for look-and-feel)        |
| --------- | -------------------- | -------------------------------------- |
| `/`       | `app/page.tsx`       | `components/design/screens/Home.tsx`   |
| `/soccer` | `app/soccer/page.tsx`| `components/design/screens/Soccer.tsx` |
| `/f1`     | `app/f1/page.tsx`    | `components/design/screens/F1.tsx`     |

Screens are built from pieces in `components/soccer/` and `components/f1/`. "Restyle one row" →
a piece file; "rearrange the page" → the screen file.

## Shell, nav, ticker (`components/design/DesignShell.tsx`)
Frame wrapped around every page. Contains:
- **Nav** (`Nav`) — pill list `Home · World Cup · Formula 1`. Desktop pills; mobile (≤640px) menu.
- **Logo** (`Logo`) — the bar-chart mark + `LIVE`(white)`LEAGUE`(accent) wordmark. Reuse this exact
  component anywhere the logo appears; do not redraw a divergent mark.
- **Sign-in** = `ShellAuth` — a single outline "Sign in" button — opens the auth modal via
  `openAuth('signin')`. (There is NO separate nav "Sign up" button — removed deliberately; the
  modal has both Sign in / Create account tabs.)
- **Live score ticker** — slim strip under the nav on every page. Reads the same live data the app
  polls; shows live items (red dot + minute) distinct from upcoming (time). Auto-scrolls slowly,
  pauses on hover, respects prefers-reduced-motion, never empty (falls back to today/upcoming).

## Auth modal (`components/design/auth/`)
- `authClient.ts` — **BACKEND SEAM.** Typed mock stubs (`signInWithEmail`, `signUpWithEmail`,
  `signInWithOAuth`, `checkUsernameAvailability`, `getSession`, `signOut`) returning a typed
  `AuthResult`. Every function marked `// BACKEND SEAM: replace with Supabase`. UI calls ONLY these.
- `AuthModalProvider.tsx` — context exposing `openAuth(mode)` / `closeAuth()`; renders the modal.
  Any CTA (Unlock $5, Get the bundle, Join a league) can open it with one line.
- `AuthModal.tsx` — two-column modal (brand panel + form), Sign in / Create account tabs,
  Google/Apple buttons, email/username/password, debounced live username check, full a11y (focus
  trap, Esc/backdrop close, scroll lock). Success currently `console.log`s the user — real session
  handling is the seam.

## Theming (`components/design/theme.tsx`)
- Named palettes: `Obsidian` (default/master), `Broadcast`, `Terminal`, `Ember`, `Paper`. Each is a
  plain color object. The active palette is exposed as **`t`**; every component reads `t.accent`,
  `t.text`, `t.surface`, etc. Nothing hardcodes hex — that's why theme-switching reskins instantly.
- `PaletteSwitcher` — floating button, bottom-right; choice persists to localStorage.
- `GlobalStyle.tsx` — fonts (**Saira Condensed** for `.disp` headers, **Inter** body), keyframes,
  scrollbars, responsive breakpoints, the page container/width.

## Design language (established — match it)
- **Obsidian dark base. Accent (lime) is SCARCE** — reserved for the primary CTA and the live
  signal. Do NOT spray accent on every label/dot/bar; scarcity is what makes it premium.
- **Sport identity colors:** F1 = red, World Cup = accent/green. F1 cards lead with the round
  number ("R8") in `.disp` + red — NO sport icon. Soccer cards use **country flags** (SVG flag set
  keyed by country code; colored-circle fallback) — NO sport icon. Apple-Sports minimalism: when in
  doubt, remove the doodle.
- **Cards:** dark surfaces, left accent bar in sport color for identity, subtle hover lift, NO
  clip-art corner badges.
- **Premium money surfaces:** the $5 bundle / lock states use a contained dark card with restrained
  **gold** accent (price as focal point) — NEVER the old yellow cross-hatch "caution-tape" look.
  Paid features should tease premium (locked/behind-glass), not look cheap.
- **Full-width centered layout** (~1280px container, equal gutters) shared across all three screens.
- **Section headers:** accent-bar + uppercase `.disp` label, used identically everywhere.
- Subtle background depth (faint corner glow / low-opacity texture) — premium, never a visible wash.

## Motion (Framer Motion — `motion/react`)
Restrained and EVENT-DRIVEN. Durations 150–450ms, ease-out, never bouncy/looping decoration.
Respect prefers-reduced-motion everywhere. Live motion (pulsing red dot, ticking minute, score
flash, breathing glow on a genuinely-live card) is driven by the **data layer's live signal**, NOT
hardcoded in components — so real live data lights it up with zero UI changes. Do NOT add count-ups
or stagger cascades. One subtle load ease-in on the hero/ticker is fine.

### DEV demo-live flag
A single, clearly-commented dev switch injects ONE fake live match into the data the hero + ticker
read, so live UI can be verified when nothing's really live. Lives in ONE flagged spot in the data
layer (NOT scattered in components). **Must default OFF** — production never shows a fake live state.

## The $5 World Cup Bundle (paid tier)
Gated paid features: **live prediction / predictor, real win-probability, friend leagues,
prediction alerts, follow up to 4 teams.** Free tier: scores, standings, fixtures, basic profiles,
clearly-labeled SAMPLE win-prob. Design rule: don't hide paid features — TEASE them premium
(blurred/locked behind glass with the price), never the cheap yellow box. Every paid surface gets a
placeholder seam; the partner wires Supabase/Stripe later.

## Data layer (backend — all five sports)
Each sport is one adapter implementing `SportAdapter` (`lib/sports/types.ts`): `getLive()` fetches +
normalizes into the shared `Game` shape, falls back to `snapshot()` on error. Each bundle carries a
`reason` (`live`/`empty`/`fallback`/`sample`) — drives the honest status pill. **Never label a
fallback "Offline."** Sport detail in a discriminated `Game.extra` union.
- `lib/sports/registry.ts` (`SPORTS[]`, server) · `meta.ts` (client-safe metadata)
- `app/api/<sport>/route.ts` proxy · `app/api/live` aggregate · all `force-dynamic`
- Polling: `hooks/useLive.ts` + `lib/polling.ts` — ~15s live → 5m idle.
- Live status is clock-checked (`clampLive()` in `lib/normalize.ts`) so a finished game never shows
  "live" hours later.

## Data sources (FREE-ONLY — constraint)
Jolpica (F1), TheSportsDB (soccer), ESPN public JSON (NBA/MLB), snapshot (cricket). **No licensed
data** → live xG / heatmaps / lineups / official win-probability are out of scope until there's a
budget; use transparent, clearly-labeled approximations.

## Commands
```bash
npm run dev      # http://localhost:3000
npm run build    # production build (also typechecks + lints)
npm test         # Vitest (tests/)
npm run lint     # eslint
```

## Conventions & gotchas
- **Live UI = inline `style={{…}}` + `t.*`, not Tailwind.** Match surrounding design-system code;
  never reach for `[data-sport]`/`var(--accent)` (dormant).
- **Pure logic → `.ts`, not `.tsx`** (Vitest chokes on imported `.tsx`). Inject `now`/params instead
  of `Date.now()` so tests are deterministic.
- **Client components must not import server adapters/registry.** Use client-safe modules + `import type`.
- **Backend seams:** anything needing real backend (auth, payments, predictions, followed teams,
  H2H/player data) goes behind ONE clearly-commented typed stub (`// BACKEND SEAM: replace with
  Supabase`), returning mock/empty data. UI talks only to the seam. This keeps the partner's
  integration a small swap, not a rewrite. Never scatter mock values into components.
- The app models **2026** events; "now" is the runtime clock.
- ESPN/team logos are image URLs (`logoUrl`, rendered as `<img>`), not text.

## Working cadence
- Unit-test logic where practical. Keep change logs current: backend change → top entry in
  **BACKEND.md**; UI change → **FRONTEND.md** (newest-first, short: what/where/why).
- Before writing code on a task, **read the relevant `components/design/` files and restate which
  files you'll touch + any seam interface**, then implement.
- All changes ADDITIVE; existing screens must not regress; **build must stay green, no console errors.**
- After implementing, list changes file-by-file and what to verify at localhost:3000.

## Known follow-ups (not yet built)
- Home: **adaptive live hero** for when 2–3+ matches are live at once (currently spotlights only one).
- Soccer: match-detail route, team-profile route, player-profile route (real routes, not modals, so
  back/share/deep-link work natively); knockout bracket; qualification-scenario lines; form strings
  on standings. Free vs paid layers on each.
- Fix any stale SAMPLE win-prob showing wrong team names on the featured card.

## Deploy
GitHub Actions (`.github/workflows/deploy.yml`), token-based, gated on lint + tests. Needs repo
secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (still to be added by owner), and the
native Vercel Git integration disconnected. Live site untouched until a deliberate PR from
`frontend-polish`.
