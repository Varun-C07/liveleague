# Live League — Multi-Sport Live Tracker

One broadcast-style board for every live league that matters — **Formula 1**, the **FIFA
World Cup**, the **NBA**, **cricket** and **MLB** — with a cross-sport home page, a personal
agenda, and a dedicated board per sport. Live scores, standings and start times that refresh
themselves.

Built as a single **Next.js 15 / React 19 / Tailwind v4** app with a serverless data layer:
per-sport upstream feeds are proxied and cached server-side (keys hidden), with a verified
snapshot fallback so a board is never blank.

- **Repo:** github.com/Ayush-Chaudhary/liveleague (`main`)
- **Deploy:** Vercel, automated via GitHub Actions (see [Deploy](#deploy))

## Features

- **Cross-sport home page** — what's live across all five leagues at a glance: a global ticker
  and a per-sport status card (live count / next-up countdown) that links to each board.
- **My Agenda** (`/agenda`) — every match across all sports in **Today / This Week / This Month**
  tabs, grouped by day, with a **★ My Teams** filter.
- **Per-sport boards** —
  - **F1**: race calendar with podium rostrums, drivers' championship strip, and **driver
    profiles** (`/f1/driver/[code]`) — season results + gap-to-leader, points remaining, and
    "can still win / can't be caught" math.
  - **Soccer**: the 104-match World Cup with live group tables, favorites, goal-flash.
  - **NBA / MLB**: live scores with quarter+clock / inning, on a shared board.
  - **Cricket**: fixtures (snapshot for now).
- **Favorites across every sport** — star any team (namespaced `sport:code`), with a **My Teams**
  filter on the boards and the agenda.
- **Honest live status** — the sync pill reads **Live · synced** / **No games today** /
  **Sample data** / **Showing saved data** (never a misleading "Offline"), driven by a `reason`
  on each data bundle.
- **Per-sport accent theming** — the whole UI re-themes to each sport's color via one
  `[data-sport]` attribute (F1 red, soccer green, NBA orange, cricket teal, MLB blue).
- **Adaptive polling** — ~15s while games are live, backing off to 5 min when idle; serverless
  proxy + CDN caching collapses many clients into a few upstream calls. Snapshot fallback per
  sport so a board never renders blank.
- **Live-status clamp** — upstream "live" is sanity-checked against the clock so a finished game
  can't show as live hours later (a real bug we fixed for soccer).
- **Polish** — score number-glow on changes, framer-motion transitions, glassmorphism, timezone
  toggle (ET / local / UTC).

## How it works

Every sport implements one small **adapter** (`lib/sports/<sport>.ts`) that normalizes its
upstream feed into a shared `Game` shape (`lib/sports/types.ts`) and provides a snapshot
fallback. The home page aggregates every adapter through one cached `/api/live` route; each
sport page polls its own `/api/<sport>` route adaptively; `/api/agenda` fans out across all.

```
app/                / (home) · /agenda · /f1 · /f1/driver/[code] · /soccer · /nba · /cricket · /baseball · /api/*
components/
  shell/            AppShell — sticky nav, per-sport accent theming via [data-sport]
  shared/           generic: GameTicker, GameRow, SportBoard, LiveStatusCard, FilterBar,
                    StandingsStrip, SportHeader, SyncPill, Countdown, FavoritesStar
  soccer/  f1/      sport-specific boards & rows
  agenda/  home/    cross-sport agenda & overview
lib/sports/         types.ts (the contract) · registry.ts · meta.ts · format.ts ·
                    one adapter per sport · agenda.ts (+ agenda-window.ts, client-safe) ·
                    espn.ts · f1-driver.ts · f1-scenarios.ts
data/snapshots/     offline fallbacks per sport
tests/              Vitest unit tests for the pure logic
```

To **add a sport**: implement an adapter against the `SportAdapter` contract, register it in
`lib/sports/registry.ts` and `lib/sports/meta.ts`, then add `/api/<sport>` and `/<sport>` (team
sports reuse `components/shared/SportBoard.tsx`).

## Data sources (free-only for now)

| Sport   | Source                            | Key? |
| ------- | --------------------------------- | ---- |
| F1      | Jolpica F1 API (Ergast successor) | no   |
| Soccer  | TheSportsDB (Premium v2 optional) | yes¹ |
| NBA     | ESPN public scoreboard JSON       | no   |
| MLB     | ESPN public scoreboard JSON       | no   |
| Cricket | snapshot fixture set²             | no   |

¹ Free public key `123` works; a Premium key enables the v2 livescore feed.
² Free live cricket feeds are inconsistent to parse, so cricket ships snapshot-first; a real
upstream (CricAPI / ESPN cricket) can be slotted into `getLive()` later with no UI change.

## Develop

```bash
npm install
cp .env.local.example .env.local   # optional — sensible defaults are built in
npm run dev                        # http://localhost:3000
npm run build && npm start         # production build
npm test                           # Vitest unit tests
npm run lint
```

Inspect the data layer directly at `/api/live`, `/api/agenda`, and `/api/<sport>` (e.g. `/api/f1`).

## Deploy

Deploys run on **GitHub Actions** (`.github/workflows/deploy.yml`): every push to `main` runs
lint + tests, then builds & deploys to Vercel with the Vercel CLI using a token (this avoids the
native GitHub-integration "not a member of the team" error and gates deploys on green tests).

**One-time setup** — add three repo secrets (*Settings → Secrets and variables → Actions*):
`VERCEL_TOKEN` (Vercel → Account Settings → Tokens), and `VERCEL_ORG_ID` + `VERCEL_PROJECT_ID`
(from `vercel link`, which writes `.vercel/project.json`). Then disconnect the native Git
integration in the Vercel project (*Settings → Git*) so only the Action deploys.

## Roadmap

Shipped and planned work is tracked in **[ROADMAP.md](./ROADMAP.md)** and the working plan at
`~/.claude/plans/`. In short: v1 (this) is a free, read-only live tracker + personal agenda;
the next phase adds a **Supabase** backend (data + auth) and **Stripe** payments to unlock
predictions, friend leaderboards, shareable cards, and a Tournament Pass.
