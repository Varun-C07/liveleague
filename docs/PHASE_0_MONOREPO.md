# Phase 0 — Monorepo Foundation (done)

Status of the first phase of `docs/MOBILE_DEPLOYMENT_PLAN.md`. Landed on branch
`mobile/phase-0-monorepo`.

## What changed
The repo is now an **npm-workspaces + Turborepo monorepo** so a future
`apps/mobile` (Expo) can share code with the web app.

```
liveleague/
  apps/
    web/                 # the existing Next.js app (moved here wholesale, history preserved)
  packages/
    core/                # @liveleague/core — shared pure-TS logic (no DOM, no server)
  package.json           # workspace root (workspaces: apps/*, packages/*) + turbo scripts
  turbo.json
  supabase/  docs/  *.md # unchanged, stay at root
```

### `@liveleague/core` (the shared package)
Source-only package (ships `.ts`; web transpiles it via `next.config` `transpilePackages`).
Holds the logic the mobile app will reuse:

- `win-prob`, `scoring`, `polling`, `gating`, `favorites`, `group-scenarios`, `joincode`
- `sports/types`, `sports/meta`, `sports/format`, `sports/f1-scenarios`, `sports/agenda-window`
- `types` (soccer domain) and `api-shape` (API DTOs) — **subpath-only** (they share names
  `StandingRow` / `DataSource` with `sports/types`, so they're kept off the root barrel).

Import styles:
```ts
import { winProb } from "@liveleague/core/win-prob";      // granular subpath
import type { Game } from "@liveleague/core";              // root barrel (multi-sport types + logic)
import type { Match } from "@liveleague/core/types";       // soccer-domain types (subpath only)
import type { ApiMatch } from "@liveleague/core/api-shape"; // API DTOs (subpath only)
```

**Stayed in `apps/web`** (server-side, data-coupled): the sport adapters
(`lib/sports/soccer.ts`, `f1.ts`, …), `registry.ts`, `normalize.ts`, `schedule.ts`,
`standings.ts`, `jolpica-race.ts`, `f1-driver.ts`, the ESPN parsers, and `data/`.
The mobile app consumes already-normalized data through the `/api/*` routes, so it
doesn't need these.

## Commands (run from repo root)
```bash
npm install            # installs all workspaces, links @liveleague/core
npm run dev            # turbo → next dev (web)   ·   or: npm run dev:web
npm run build          # turbo → build core (noop) + web   ·   or: npm run build:web
npm test               # turbo → vitest in core + web (100 tests)
npm run lint           # turbo → eslint (web)
npm run typecheck --workspace @liveleague/core   # core tsc --noEmit
```

## ⚠️ Required manual step before the next deploy
The Next.js app now lives in `apps/web`, so the **Vercel project's Root Directory
must be changed to `apps/web`**:

> Vercel → Project (`liveleague`) → Settings → General → **Root Directory** → `apps/web` → Save.

Until that's set, `vercel build` / `npx vercel deploy --prod` (and the GitHub Action's
deploy steps) won't find the app. CI lint/test is unaffected (root scripts proxy via Turbo).
Vercel auto-detects Turborepo and will still cache/build correctly once the root dir is set.

## Verification (all green at commit time)
- `npm test` → **100 tests pass** (63 in core, 37 in web).
- `npm run lint` → clean.
- `npm run build` → production build succeeds.
- `npm run typecheck --workspace @liveleague/core` → clean.

## Not done in Phase 0 (deferred)
- `packages/api-client` (centralizing the typed `/api/*` surface) — its own focused step;
  not needed to start the mobile app.
- Updating every path reference in `CLAUDE.md`/`FRONTEND.md`/`BACKEND.md` to `apps/web/…`
  (a top-of-file structural note was added instead).

## Next (Phase 1 / 2)
Apple Developer enrollment (long pole — start now) and scaffolding `apps/mobile` (Expo +
expo-router). See `docs/MOBILE_DEPLOYMENT_PLAN.md` §4–5.
