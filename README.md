# Live League — Multi-Sport Live Tracker

One broadcast-style board for every live league that matters — **Formula 1**, the **FIFA
World Cup**, the **NBA**, **cricket** and **MLB** — with a cross-sport home page and a
dedicated board per sport. Live scores, standings and start times that refresh themselves.

Built as a single **Next.js 15 / React 19** app with a serverless data layer: per-sport
upstream feeds are proxied and cached server-side (keys hidden), with a verified snapshot
fallback so a board is never blank.

## Features

- **Cross-sport home page** — one glance at what's live across all five leagues, a global
  ticker and a per-sport status card that links to each board.
- **Per-sport boards** — F1 podiums & drivers' championship; the 104-match World Cup with
  group tables; NBA/MLB live scores with quarter/clock and inning/outs; cricket fixtures.
- **Adaptive polling** — fast (~15s) while games are live, backing off to 5 min when idle;
  serverless proxy + CDN caching collapses many clients into a few upstream calls.
- **Per-sport accent theming** — the whole UI re-themes to each sport's color via a single
  `[data-sport]` attribute (F1 red, soccer green, NBA orange, cricket teal, MLB blue).
- **Snapshot fallback** per sport so a board never renders blank if a feed is unreachable.
- **Timezone toggle** (ET / local / UTC), score-flash highlights, framer-motion transitions.

## How it works

Every sport implements one small **adapter** (`lib/sports/<sport>.ts`) that normalizes its
upstream feed into a shared `Game` shape (`lib/sports/types.ts`) and provides a snapshot
fallback. The home page aggregates every adapter through one cached `/api/live` route; each
sport page polls its own `/api/<sport>` route adaptively.

```
app/                / (home) + /f1 /soccer /nba /cricket /baseball + /api/* routes
components/
  shell/            AppShell — sticky nav, per-sport accent theming via [data-sport]
  shared/           generic: GameTicker, GameRow, SportBoard, LiveStatusCard, Filters, …
  soccer/  f1/      sport-specific boards & rows
  home/             cross-sport overview
lib/sports/         types.ts (the contract) · registry.ts · meta.ts · one adapter per sport
data/snapshots/     offline fallbacks per sport
```

## Data sources

| Sport   | Source                            | Key? |
| ------- | --------------------------------- | ---- |
| F1      | Jolpica F1 API (Ergast successor) | no   |
| Soccer  | TheSportsDB (Premium v2 optional) | yes¹ |
| NBA     | ESPN public scoreboard JSON       | no   |
| MLB     | ESPN public scoreboard JSON       | no   |
| Cricket | snapshot fixture set (v1)²        | no   |

¹ Free public key `123` works; a Premium key enables the v2 livescore feed.
² Free live cricket feeds are inconsistent to parse, so cricket ships snapshot-first; a real
upstream (CricAPI / ESPN cricket) can be slotted into `getLive()` later with no UI change.

## Develop

```bash
npm install
cp .env.local.example .env.local   # optional — sensible defaults are built in
npm run dev                        # http://localhost:3000
npm run build && npm start         # production build
```

Inspect the data layer directly at `/api/live` and `/api/<sport>` (e.g. `/api/f1`).

## Deploy (Vercel)

Import the repo at **vercel.com → Add New Project** (auto-detects Next.js). Optionally set
the env vars from `.env.local.example` (TheSportsDB Premium key, site URL). No other config
needed — the serverless routes and CDN caching work out of the box.

## Roadmap / future enhancements

- Per-sport favorites + score-sound across all boards (currently soccer only).
- A real live cricket feed (CricAPI / ESPN cricket) behind the cricket adapter.
- Design-tool integration: **Figma Dev Mode MCP** or **v0** to evolve the UI in code.
- Paid real-time feeds (push / websocket) for true sub-second live updates.
