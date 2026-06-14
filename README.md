# FIFA World Cup 2026 — Live Board

A broadcast-style web app for the **FIFA World Cup 2026** (USA · Canada · Mexico) — the
first 48-team World Cup, all **104 matches** from the group stage through the final, with
live scores, group tables, kickoff countdowns and US-Eastern times.

Rebuilt from the original single-file board into a full **Next.js** app with a serverless
data layer.

## Features

- **Live scores & status** via a serverless proxy over TheSportsDB (cached + key-hidden),
  with adaptive client polling (~15s while matches are live, backing off when idle).
- **Goal flash** — rows highlight (and optionally chime) the instant a score changes.
- **Group standings** for all 12 groups, computed from results, incl. the best-8 third-place race.
- **Favorite teams** (★) — starred nations pin to the top and highlight across the board.
- **Today view**, **Live** filter, **auto-pin** live matches, plus Completed / Upcoming /
  Group Stage / Knockouts filters.
- **Share** + **Add-to-Calendar (.ics)** per match; deep links (`#today`, `#live`, `#match-9`).
- **Timezone toggle** (ET / local / UTC) and a goal-sound toggle.
- Verified offline **snapshot fallback** so the board is never blank.

## Tech

- **Next.js 15** (App Router) + **React 19** + **TypeScript** + **Tailwind v4**
- **@tanstack/react-query** (adaptive polling), **framer-motion**, **date-fns / date-fns-tz**, **lucide-react**
- Serverless **Route Handlers** (`/api/matches`, `/api/standings`) normalize, cache and
  fall back to the snapshot — the upstream key never reaches the browser.

```
data/      verified dataset (teams, groups, venues, 104-match schedule, results)
lib/       schedule assembly, standings, normalize/name-matching, tsdb adapter, time, ics
app/api/   serverless data layer
components/ board UI (broadcast/stadium dark theme)
hooks/     React Query data + favorites/prefs/goal-flash
```

## Develop

```bash
npm install
npm run dev   # http://localhost:3000
```

Inspect the data layer directly at `/api/matches` and `/api/standings`.

## Deploy (Vercel)

1. Import the repo at **vercel.com → Add New Project** (auto-detects Next.js).
2. Set env vars (Production + Preview):
   `TSDB_API_KEY=123`, `TSDB_API_BASE=https://www.thesportsdb.com/api`,
   `TSDB_PREMIUM=false`, `NEXT_PUBLIC_SITE_URL=https://<project>.vercel.app`.
3. Deploy. Adding a TheSportsDB Premium key later flips on the v2 livescore feed with no
   client changes.

> The original single-file board still lives at `index.html` (served by GitHub Pages from
> `main`) until the Vercel app becomes the canonical URL.
