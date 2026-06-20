# CLAUDE.md — Live League

Context for Claude Code working in this repo. Pair with **README.md** (overview) and
**ROADMAP.md** (timeline + what's next).

## What this is
A single **Next.js 15 (App Router) / React 19 / TypeScript** app for live sports. The **data
layer** still tracks five leagues — F1, World Cup soccer, NBA, cricket, MLB — but the **live UI
today surfaces three screens: Home, World Cup soccer, and F1.** Live data is server-proxied from
**free** feeds with per-sport snapshot fallbacks. The app is the repo root (this directory). Repo:
`github.com/Ayush-Chaudhary/liveleague` (`main`).

## ⚠️ Two UI systems — read this first
The repo contains two parallel front-ends. Know which one is live before you touch anything.

- **LIVE → `components/design/`.** This is what actually renders. It styles with **inline
  `style={{…}}` driven by a theme object** (`t.*`), *not* Tailwind classes. It's wired in via
  `app/layout.tsx` (`ThemeProvider` → `DesignShell`). **All visual work happens here.**
- **DORMANT — do NOT edit unless explicitly reviving it:** `components/shell/` (old `AppShell`,
  old `AuthControl` sign-in), `components/home/`, `components/shared/SportBoard.tsx`, the Tailwind
  **`[data-sport]` accent system and `var(--accent)` tokens in `app/globals.css`**. Still in the
  repo, not rendered. The NBA / cricket / MLB / agenda routes belong to this old system.

### How to make a change show up on screen
**Start in `components/design/`.** If a request is "change how the app looks," the fix is almost
always a design-system file — never the dormant shell or the Tailwind tokens.
- Page body / layout → `components/design/screens/*` (or the smaller pieces in
  `components/soccer/`, `components/f1/`).
- Nav bar, logo, Sign in → `components/design/DesignShell.tsx`.
- Colors / themes → `components/design/theme.tsx`. Fonts, animations, mobile breakpoints →
  `components/design/GlobalStyle.tsx`.

## Pages (loader → screen)
Each `app/.../page.tsx` is a thin **data loader** (server-fetches + seeds cache-first) that hands
off to a **screen** component owning all the visuals:

| URL       | Loader (data)        | Screen — edit this for look-and-feel        |
| --------- | -------------------- | ------------------------------------------- |
| `/`       | `app/page.tsx`       | `components/design/screens/Home.tsx`        |
| `/soccer` | `app/soccer/page.tsx`| `components/design/screens/Soccer.tsx`      |
| `/f1`     | `app/f1/page.tsx`    | `components/design/screens/F1.tsx`          |

Screens are assembled from smaller pieces: `components/soccer/` (match rows, group standings,
ticker…) and `components/f1/` (podium, race rows, driver profile…). "Restyle one match row" → a
piece file; "rearrange the whole page" → the screen file. The screens consume our API shapes
through the pure adapters in `components/design/map.ts` (unit-tested, no React/I/O).

## Shell: nav, logo, Sign in
All three live in **`components/design/DesignShell.tsx`**, the frame wrapped around every page:
- **Nav** (`Nav` function) — pill list `Home · World Cup · Formula 1` at the top of the file.
  Desktop = inline pills; mobile (≤640px) = tap-to-open menu.
- **Logo** (`Logo`) and the notification bell (`ShellBell`).
- **Sign in = the `ShellAuth` function.** Signed out → "Sign in"; signed in → avatar + name →
  `/account`. (The old sign-in in `components/shell/AuthControl.tsx` is DORMANT — don't edit it.)

## Theming
**`components/design/theme.tsx`** is the master:
- **Named palettes** — `Obsidian` (default / master), `Broadcast`, `Terminal`, `Ember`, `Paper`.
  Each is a plain object of colors (bg, accent, text, live, …). Add/tweak a theme = add/edit a
  palette here.
- The active palette is exposed as **`t`**, and every design component reads its colors from
  `t.*` (`t.accent`, `t.text`, `t.surface`…). Nothing hardcodes hex — that's why switching themes
  reskins the whole app instantly.
- **`PaletteSwitcher`** — the floating paint-palette button (bottom-right); the choice persists to
  `localStorage`.
- **`components/design/GlobalStyle.tsx`** injects fonts, keyframe animations, scrollbars and the
  responsive breakpoints. Fonts: **Saira Condensed** for `.disp` headers, **Inter** for body.

## Data layer (backend — still all five sports)
Every sport is one **adapter** implementing `SportAdapter` (`lib/sports/types.ts`): `getLive(live)`
fetches + normalizes its feed into the shared **`Game`** shape and falls back to `snapshot()` on
error. Sport-specific detail lives in a discriminated `Game.extra` union. Each bundle carries a
**`reason`** (`live`/`empty`/`fallback`/`sample`) that drives the honest status pill — never call a
snapshot "Offline".
- `lib/sports/registry.ts` — `SPORTS[]` (server). `meta.ts` — client-safe static metadata.
- `app/api/<sport>/route.ts` — per-sport proxy; `app/api/live` — home aggregate; `app/api/agenda`
  — cross-sport agenda. All `force-dynamic` + `Cache-Control s-maxage`.
- Polling: `hooks/useLive.ts` + `lib/polling.ts` (`intervalFromLive`): ~15s live → 5m idle.

## Commands
```bash
npm run dev      # http://localhost:3000
npm run build    # production build (also typechecks + lints)
npm test         # Vitest unit tests (tests/)
npm run lint     # eslint
```

## Data sources (FREE-ONLY — important constraint)
Jolpica (F1), TheSportsDB (soccer), ESPN public JSON (NBA/MLB), snapshot (cricket). **No
licensed data** → live xG / heatmaps / lineups / official win-probability are out of scope until
there's a budget; use transparent approximations. See ROADMAP "Phase 7".

## Conventions & gotchas
- **The live UI styles with inline `style={{…}}` + `t.*`, not Tailwind.** Match the surrounding
  design-system code; don't reach for `[data-sport]`/`var(--accent)` (those are dormant).
- **Pure logic → `.ts`, not `.tsx`.** tsconfig uses `jsx:"preserve"` for Next, which makes Vitest
  choke on imported `.tsx`. Keep testable helpers in `.ts` (e.g. `lib/favorites.ts`,
  `lib/sports/agenda-window.ts`, `components/design/map.ts`). Tests live in `tests/` (excluded from
  tsconfig); inject `now`/params instead of calling `Date.now()` directly so tests are deterministic.
- **Client components must not import server adapters/registry.** Use client-safe modules
  (`meta.ts`, `agenda-window.ts`, `format.ts`) and `import type` for types.
- **Live status must be clock-checked.** `clampLive()` in `lib/normalize.ts` prevents a finished
  game from showing "live" hours later (the soccer bug we fixed). Resolve kickoff before status.
- **Never label a fallback "Offline."** Use the bundle `reason`.
- The app models **2026** events; "now" comes from the runtime clock.
- ESPN team logos are image URLs → `Competitor.logoUrl` (rendered as `<img>`), not `logo` (text/emoji).

## Working cadence (owner's instruction)
**Unit-test each iteration** and **commit + push to `main` after each checkpoint.** Commit
messages end with the `Co-Authored-By: Claude` trailer.

**Keep the change logs current.** Any back-end change (data layer, APIs, auth, payments,
caching, data sources) → add a top entry to **BACKEND.md** (it also holds an architecture map —
update that when tables/routes/sources change). Any UI/UX change → **FRONTEND.md**. Newest-first,
short: what changed, where, why.

## Deploy
GitHub Actions (`.github/workflows/deploy.yml`), token-based, gated on lint + tests. Needs repo
secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (still to be added by the owner), and
the native Vercel Git integration disconnected. Details in README → Deploy.

## Next up
**Phase 2 = backend foundation: Supabase (Postgres data + Auth) + Stripe (payments).** Then the
viral free prediction loop. Full plan in ROADMAP.md.
