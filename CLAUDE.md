# CLAUDE.md — Live League

Context for Claude Code working in this repo. Pair with **README.md** (overview) and
**ROADMAP.md** (timeline + what's next).

## What this is
A single **Next.js 15 (App Router) / React 19 / Tailwind v4 / TypeScript** app that tracks five
leagues — **F1, World Cup soccer, NBA, cricket, MLB** — with a cross-sport home page, a personal
agenda, and a board per sport. Live data is server-proxied from **free** feeds with per-sport
snapshot fallbacks. The app is the repo root (this directory). Repo:
`github.com/Ayush-Chaudhary/liveleague` (`main`).

## Commands
```bash
npm run dev      # http://localhost:3000
npm run build    # production build (also typechecks + lints)
npm test         # Vitest unit tests (tests/)
npm run lint     # eslint
```

## Architecture (the important part)
Every sport is one **adapter** implementing `SportAdapter` (`lib/sports/types.ts`):
`getLive(live)` fetches + normalizes its feed into the shared **`Game`** shape and falls back to
`snapshot()` on error. Sport-specific detail lives in a discriminated `Game.extra` union. Each
bundle carries a **`reason`** (`live`/`empty`/`fallback`/`sample`) that drives the honest status
pill — never call a snapshot "Offline".

- `lib/sports/registry.ts` — `SPORTS[]` (server). `meta.ts` — client-safe static metadata.
- `app/api/<sport>/route.ts` — per-sport proxy; `app/api/live` — home aggregate;
  `app/api/agenda` — cross-sport agenda. All `force-dynamic` + `Cache-Control s-maxage`.
- Boards: soccer & F1 are bespoke (`components/soccer`, `components/f1`); NBA/MLB/cricket reuse
  the generic `components/shared/SportBoard.tsx`. Home = `components/home`, agenda = `components/agenda`.
- Theming: `components/shell/AppShell.tsx` sets `[data-sport]` → `var(--accent)` cascades
  everywhere (tokens in `app/globals.css`).
- Polling: `hooks/useLive.ts` + `lib/polling.ts` (`intervalFromLive`): ~15s live → 5m idle.

### To add a sport
Write `lib/sports/<sport>.ts` (adapter) → add to `registry.ts` + `meta.ts` → add
`app/api/<sport>/route.ts` and `app/<sport>/page.tsx` (team sports: render `SportBoard`).

## Data sources (FREE-ONLY — important constraint)
Jolpica (F1), TheSportsDB (soccer), ESPN public JSON (NBA/MLB), snapshot (cricket). **No
licensed data** → live xG / heatmaps / lineups / official win-probability are out of scope until
there's a budget; use transparent approximations. See ROADMAP "Phase 7".

## Conventions & gotchas
- **Pure logic → `.ts`, not `.tsx`.** tsconfig uses `jsx:"preserve"` for Next, which makes Vitest
  choke on imported `.tsx`. Keep testable helpers in `.ts` (e.g. `lib/favorites.ts`,
  `lib/sports/agenda-window.ts`, `f1-scenarios.ts`). Tests live in `tests/` (excluded from
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
