# Phase 2 — Mobile App Scaffold (Expo) — foundation done

Second phase of `docs/MOBILE_DEPLOYMENT_PLAN.md`. The Expo app skeleton + build
pipeline config are in place and verified to bundle. Screen-building is Varun's
job (`docs/VARUN_MOBILE_AND_ML_PLAN.md` Part A).

> Phase 1 (Apple Developer enrollment) is owned by Ayush and runs in parallel —
> it gates only the device/TestFlight builds, not this scaffold.

## What landed (`apps/mobile`)
A new workspace app: **Expo SDK 56, React 19.2, React Native 0.85, expo-router**
(typed routes off for now), wired into the monorepo and sharing `@liveleague/core`.

```
apps/mobile/
  app.json            # name "Live League", scheme liveleague://, bundle com.liveleague.app, dark UI
  eas.json            # build profiles: development / preview / production (+ submit)
  metro.config.js     # monorepo: watch workspace root, resolve root node_modules, package exports on
  tsconfig.json       # extends expo base; @/* -> src/*
  src/
    app/
      _layout.tsx              # root: QueryClient + SafeArea + GestureHandler + dark StatusBar
      (tabs)/_layout.tsx       # bottom tabs: Home · World Cup · Formula 1 · Profile
      (tabs)/index.tsx         # Home — imports @liveleague/core (proves the shared package works)
      (tabs)/soccer.tsx        # World Cup placeholder
      (tabs)/f1.tsx            # Formula 1 placeholder (crimson identity)
      (tabs)/profile.tsx       # Profile placeholder (auth/leagues/$5 bundle live here)
    components/Screen.tsx      # shared screen scaffold (safe-area, section header, card)
    theme/palette.ts           # Obsidian palette ported from web theme.tsx (+ Broadcast)
```

### Shared-code proof
`src/app/(tabs)/index.tsx` imports from `@liveleague/core` **both ways** — the
barrel (`SPORT_META`, `K_FACTOR`) and a subpath (`@liveleague/core/sports/format`).
The Metro bundle resolving these (TS source, transpiled by Metro) is the proof the
web↔mobile code-sharing from Phase 0 actually works on React Native.

## Verification (all green)
| Check | How | Result |
| --- | --- | --- |
| Metro bundle (iOS) | `npm run export --workspace mobile` (`expo export`) | **1584 modules bundled, no errors** |
| Mobile typecheck | `npm run typecheck` (turbo → core + mobile) | clean |
| Web build | `npm run build` | compiles (no regression) |
| Tests | `npm test` | 100 pass (63 core + 37 web) |
| Lint | `npm run lint` | clean |
| Expo config | `npx expo config` | name/slug/scheme/bundleId correct |

> **Not verifiable here (needs Phase 1 + an Expo login):** an actual EAS/device
> build and TestFlight upload. The Metro bundle + typecheck are the standalone
> proxy that the app compiles and the shared package resolves.

## Commands
```bash
npm run dev:mobile     # expo start (Metro dev server; press i for simulator / scan for device)
npm run typecheck      # turbo → tsc in core + mobile
npm run export --workspace mobile   # expo export (Metro bundle smoke test)
```

## Decisions / notes for Varun
- **expo-router file-based nav**, `src/` root. Add detail routes as **real routes**
  (`app/match/[id].tsx`, `app/race/[id].tsx`, `app/team/[code].tsx`) so
  back/share/deep-link work — not modals.
- **Theme:** `src/theme/palette.ts` is the Obsidian port (scarce-lime accent rules
  carried over). Next: a ThemeProvider + PaletteSwitcher, and load Saira Condensed /
  Inter via `expo-font`.
- **Tab icons** are dependency-free placeholder chips — replace with real icons.
- **`typedRoutes` is off** so standalone `tsc` is deterministic; re-enable once you
  run the dev server regularly (it generates the route types).
- **No eslint yet** for mobile (so root `npm run lint` stays web-deterministic) —
  add `eslint-config-expo` + a flat config when you start building screens.
- Data: call the existing `/api/*` routes (Bearer JWT) via `@liveleague/core` shapes;
  don't duplicate logic that belongs in `packages/core`.

## Next
- Ayush: finish Phase 1 (Apple enrollment) → then `eas build --profile development`
  for a dev client on a real iPhone, and TestFlight internal.
- Varun: start the real screens (Home live hero + ticker first), per his plan.
