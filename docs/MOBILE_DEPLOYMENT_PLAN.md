# Mobile Deployment Plan — Live League (Owner: Ayush)

> **Audience:** you (Ayush). This is the end-to-end plan to take Live League from a Next.js web app
> to a native iOS app in testers' hands (TestFlight), with Android on the roadmap. It covers
> architecture, platforms, security, payments, push, traffic/analytics, the build/release pipeline,
> store compliance, and a phased timeline.
>
> **Companion doc:** `docs/VARUN_MOBILE_AND_ML_PLAN.md` — Varun's frontend + ML work.

---

## 0. Decisions locked (from our planning session)

| Question | Decision |
| --- | --- |
| Mobile stack | **Expo / React Native** (reuse the pure-TS data layer, rebuild UI natively) |
| First target | **iOS first → TestFlight beta.** Android on the roadmap (plan for it now) |
| First milestone | **Demo/beta for testers** — mock/partial backend OK, payments stubbed |
| Payments (mobile) | **Free for beta**, design the IAP seam, decide RevenueCat-vs-raw later |
| Repo layout | **Monorepo + shared package** (Turborepo/pnpm: `apps/web`, `apps/mobile`, `packages/*`) |
| ML infra | **Separate Python (FastAPI) service** on Railway/Render; app reads predictions |
| ML data | **Free sources + scraping** (football-data.co.uk, openfootball, FBref, Kaggle) + live feeds |
| Apple account | **Not yet** — enrollment is step 1 |
| Backend host | **Keep Next.js `/api/*` on Vercel** — mobile becomes a second client |
| Design | **Evolve the existing Obsidian / scarce-lime language** natively |
| Tooling | **Sentry** (crashes) + **PostHog** (analytics/traffic) + **EAS Update** (OTA) + **Maestro/Detox + CI** |

### Reality check discovered during codebase mapping
The backend is **further along than CLAUDE.md implies.** There is already real Supabase auth,
Stripe checkout + webhooks, friend leagues, predictions + scoring, entitlements/gating, and cron
jobs (`/api/checkout`, `/api/webhooks/stripe`, `/api/leagues/*`, `/api/predictions`, `/api/me/*`,
`/api/cron/*`). So mobile is mostly **"wire a native client to an existing backend,"** not "build a
backend." That's a big head start.

---

## 1. Target architecture

```
                          ┌──────────────────────────────┐
   iOS app (Expo) ───────▶│  Next.js /api/*  (Vercel)     │──▶ Supabase (Postgres, Auth, RLS)
   Android app (later) ──▶│  existing API routes, unchanged│──▶ Stripe (web payments)
   Web (Next.js) ────────▶│  + thin mobile-friendly tweaks │──▶ Free feeds (Jolpica, TheSportsDB, ESPN)
                          └───────────────┬───────────────┘
                                          │ reads predictions
                                          ▼
                          ┌──────────────────────────────┐
                          │  Python ML service (FastAPI)  │  Railway/Render
                          │  training jobs + /predict      │──▶ writes predictions ─▶ Supabase table
                          └──────────────────────────────┘
```

**Monorepo shape (Turborepo + pnpm workspaces):**

```
liveleague/
  apps/
    web/            # existing Next.js app (moved here, otherwise unchanged)
    mobile/         # new Expo app  (Varun's primary home)
  packages/
    core/           # PORTABLE pure-TS: lib/sports/*, normalize, win-prob, scoring, types, format,
                    #   polling, standings, favorites, schedule, group/f1 scenarios  (~35% of code)
    api-client/     # shared fetch client + DTOs (api-shape.ts) — one place that knows the routes
    config/         # shared eslint/tsconfig/prettier
  services/
    ml/             # Python FastAPI ML service (Varun) — NOT a JS workspace, its own venv/Docker
  docs/
```

Why monorepo: the win-prob model, scoring rules, types, and normalization are **the same math on web
and mobile.** Sharing one `packages/core` means a model change ships to both clients and can't drift.
The exploration confirmed ~35% of the code is pure TS and portable as-is; this package is exactly
that 35%.

---

## 2. Phased roadmap (high level)

| Phase | Goal | Outcome |
| --- | --- | --- |
| **P0** | Monorepo + extract `packages/core` | Web still builds & passes tests, importing from the package |
| **P1** | Apple Developer enrollment | App Store Connect ready, bundle ID reserved |
| **P2** | Expo app skeleton + EAS | "Hello LiveLeague" build runs on a real device via TestFlight |
| **P3** | Wire data layer + read-only screens | Live scores/standings/fixtures work on device (no auth) |
| **P4** | Auth + personalized features | Sign in, follows, predictions, leagues on device |
| **P5** | Observability + traffic + OTA | Sentry, PostHog, EAS Update, CI all green |
| **P6** | Beta hardening + TestFlight external | 20–100 external testers using it |
| **P7** | ML predictions surfaced | Predictions/markets visible in app (from Python service) |
| **P8** | Payments + Android | IAP wired, public launch, Android beta |

Detailed timeline with week estimates is in §13.

---

## 3. Phase 0 — Monorepo foundation (do this first, it de-risks everything)

This is yours/shared, not Varun's — get it green before Varun starts the Expo UI.

1. **Introduce pnpm + Turborepo** at repo root (`pnpm-workspace.yaml`, `turbo.json`).
2. **Move the current app** into `apps/web/` (git mv to preserve history). Update Vercel "Root
   Directory" to `apps/web`. Verify `npm run build` + `npm test` still pass.
3. **Create `packages/core`** and move the portable pure-TS files there. From the mapping, these are
   safe to move (no DOM, no Node-only APIs):
   - `lib/sports/types.ts`, `registry.ts`, `meta.ts`, `format.ts`
   - `lib/normalize.ts`, `polling.ts`, `win-prob.ts`, `scoring.ts`, `standings.ts`,
     `favorites.ts`, `schedule.ts`, `group-scenarios.ts`, `time.ts`, `gating.ts`
   - `lib/types.ts`, `api-shape.ts`, `lib/stripe/skus.ts` (pure SKU registry)
   - `lib/sports/f1-scenarios.ts`, `f1-driver.ts` (verify no I/O first)
   - The matching tests in `tests/` move with them (keep Vitest at the package level).
4. **Create `packages/api-client`** — extract the knowledge of *which* `/api/*` routes exist and
   their request/response DTOs into one typed client. Today that knowledge is scattered in hooks;
   centralizing it means mobile and web call the backend through the same typed surface. Server
   adapters with I/O (`lib/sports/soccer.ts`, `f1.ts`, `tsdb.ts`, etc.) **stay in `apps/web`** —
   they're the server proxies.
5. **Point `apps/web` at the packages** (`import { winProb } from '@liveleague/core'`). Keep changes
   mechanical — no behavior change. Build + tests must stay green. This is a refactor PR, reviewed
   normally, merged before any mobile work.

> **Gate:** Phase 0 is "done" only when `apps/web` builds, deploys to Vercel unchanged, and the full
> Vitest suite passes from `packages/core`. Everything else depends on this.

---

## 4. Phase 1 — Apple Developer enrollment (the long pole — start it on day 1)

You don't have an account yet, and **enrollment can take 24–48h (sometimes longer) for identity
verification.** Nothing iOS ships without it, so kick it off immediately and in parallel with P0.

1. **Choose account type:**
   - **Individual ($99/yr)** — fastest, your legal name shows as the "seller." Fine for a beta.
   - **Organization ($99/yr)** — requires a **D-U-N-S number** (free but can take days/weeks to
     obtain), shows a company name, supports proper team roles. Choose this only if Live League is a
     registered entity and you want the company as seller.
   - **Recommendation for a two-person beta:** start **Individual** to unblock TestFlight; migrate to
     Organization before public launch if you incorporate.
2. **Enroll** at developer.apple.com/programs — needs Apple ID with 2FA, a payment method, and a
   government ID for verification.
3. **In App Store Connect** (once approved):
   - Create the **app record**; reserve a **Bundle ID** like `com.liveleague.app` (use a domain you
     control; it's permanent).
   - Add **Varun** as a user (role: **App Manager** or **Developer**) so he can pull build creds.
   - Set up **TestFlight** internal testers (up to 100, no review) now; external groups (up to
     10,000, requires a lightweight Beta App Review) in P6.
4. **Credentials:** let **EAS (Expo) manage signing certificates & provisioning profiles** — it
   creates and stores the distribution cert and provisioning profile for you, so you don't hand-manage
   `.p12`/`.mobileprovision` files. This is the single biggest pain-reducer for iOS.

> **Cost:** $99/yr Apple Developer. (Google Play is a one-time $25 when you do Android.)

---

## 5. Phase 2 — Expo app skeleton + build pipeline

This proves the whole pipeline works before any real UI. (Varun owns the app contents; you co-own the
pipeline.)

1. **Scaffold** `apps/mobile` with Expo (managed workflow) + **expo-router** (file-based nav, mirrors
   how the web app uses Next's router). TypeScript template.
2. **Install EAS CLI**, run `eas build:configure`. Define **3 build profiles** in `eas.json`:
   `development` (dev client, for fast iteration), `preview` (internal ad-hoc / simulator),
   `production` (store / TestFlight).
3. **First build:** `eas build --platform ios --profile preview` → install on a device. Confirm the
   round-trip (code → EAS cloud build → device) works.
4. **TestFlight path:** `eas build --profile production` then `eas submit --platform ios` uploads to
   App Store Connect → appears in TestFlight for internal testers.
5. **EAS Update (OTA):** configure now so JS-only fixes ship to testers **without a new build**
   (huge velocity win during beta — see §10).

---

## 6. Security & secrets (production-grade from the start)

Security is mostly about **respecting the existing trust boundaries** the backend already has, and not
leaking secrets into the mobile bundle.

### 6.1 The golden rule for mobile secrets
**Anything shipped in the app binary is public.** Assume any string in the Expo bundle can be
extracted. Therefore:
- ✅ Safe in the app: the **Supabase anon/public key**, the public Supabase URL, PostHog **client**
  key, Sentry DSN. These are designed to be public and are protected by RLS / server validation.
- ❌ Never in the app: `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE` / admin key, any third-party API
  secret, signing keys. These stay **server-only** (Vercel env, the Python service env). The mobile
  app calls your `/api/*` routes, which hold the secrets.
- Use **`expo-constants` / EAS environment variables / `app.config.ts` `extra`** for public config;
  use **EAS Secrets** for anything build-time sensitive. Never commit `.env` with real values.

### 6.2 Supabase / data security
- **Row Level Security (RLS) is your real authorization layer** — verify every user-scoped table
  (`leagues`, `predictions`, `pinned_matches`, `profiles`, `entitlements`, follows) has RLS policies
  so a stolen anon key still can't read other users' rows. This protects web today and mobile
  tomorrow identically. Audit this as part of P4.
- Mobile uses the **same Supabase JS SDK** (it works in RN). Session tokens must be stored in
  **secure storage** (`expo-secure-store`, backed by iOS Keychain), **not** AsyncStorage, which is
  plaintext. Configure the Supabase client's storage adapter to SecureStore.

### 6.3 Transport & API hardening
- **HTTPS only** everywhere (Vercel + Railway both enforce TLS).
- **CORS / origin:** today `/api/*` is same-origin (web). Mobile requests are cross-origin-ish (no
  browser origin). Decide auth for mobile: pass the **Supabase JWT as a `Bearer` token** and have the
  routes verify it server-side (the cookie-based `supabase-server.ts` path won't apply to native).
  This is a small, well-scoped change to the API routes in P4.
- **Rate limiting** on the public proxy routes (e.g. Upstash rate-limit on `/api/live`, `/api/soccer`)
  to protect your free-feed quotas from a misbehaving or abusive client.
- Optional later: **certificate pinning** for the highest-value endpoints. Overkill for beta; note it
  for production.

### 6.4 Auth specifics for mobile (Apple requirement!)
- **OAuth deep-linking:** Google/Apple sign-in on native uses an app redirect scheme
  (`liveleague://auth-callback`) via `expo-auth-session` / Supabase's native OAuth flow — different
  from the web's `window.location` redirect in `authClient.ts`. This is the ~20% of `authClient` that
  changes for RN.
- **Apple's rule:** if you offer **any** third-party social login (you offer Google), Apple **requires
  you to also offer "Sign in with Apple"** or the app gets rejected. Budget for implementing Sign in
  with Apple before store submission. (Email/password alone is exempt; Google triggers the rule.)
- Store secrets/tokens in Keychain via `expo-secure-store` as above.

### 6.5 Privacy & compliance baseline (needed for TestFlight external + App Store)
- **App Privacy "nutrition label"** in App Store Connect: declare what you collect (email, analytics,
  crash data, usage). PostHog/Sentry collect data → must be declared.
- **App Tracking Transparency (ATT):** only required if you track users across other companies' apps
  for ads. PostHog first-party product analytics generally **doesn't** require the ATT prompt if you
  don't share IDs with ad networks — configure PostHog accordingly and you can avoid the prompt.
- **Privacy policy URL** is mandatory for store submission — host one (even a simple page on the web
  app: `/privacy`).
- **"Not gambling":** predictions are **entertainment/engagement, not wagering** — no real-money
  betting, no payouts. Keep that framing in copy and the store listing to avoid the gambling category
  and its review scrutiny (see Varun's ML doc §B for the same rule on the model side).

---

## 7. Payments on mobile (beta: free; design the seam now)

**Decision: beta ships free** (`PAYWALL_ENABLED` is already off — current state), so no IAP wiring is
needed to get testers going. But design the seam now so production is a swap, not a rewrite.

**Why you can't just reuse Stripe:** Apple requires **In-App Purchase** for digital goods consumed in
the app (your $5 World Cup bundle, subscriptions). Stripe is allowed for **physical** goods/services
only. So on iOS the bundle must go through Apple IAP (15–30% cut). Web keeps Stripe.

**Recommended production approach (design toward it now): RevenueCat over native IAP.**
- RevenueCat wraps Apple IAP (and Google Play Billing for Android later), handles receipts, restores,
  subscription state, and **webhooks your `entitlements` table in Supabase** — so the app keeps its
  single source of truth (`hasPersonal`/`hasPro` from `lib/entitlements.ts`/`gating.ts`).
- The existing entitlement gating (`requirePersonal`, `requirePro`, `Entitlements` type) **stays the
  same**; only the *writer* of entitlements differs by platform (Stripe webhook on web, RevenueCat
  webhook on mobile).

**Seam to build now (so beta is honest and prod is a swap):**
- A `packages/core` `Purchases` interface: `getOfferings()`, `purchase(sku)`, `restore()`,
  `getEntitlements()`. Beta implementation returns "all unlocked" (matches `PAYWALL_ENABLED=off`);
  production implementation calls RevenueCat. UI calls only this interface — exactly the seam pattern
  CLAUDE.md already mandates for the backend.

---

## 8. Push notifications (prediction alerts — a paid feature later)

- Use **Expo Push Notifications** (`expo-notifications`) → Expo's service → **APNs** (and FCM for
  Android later). One API for both platforms.
- Flow: app registers → gets an **Expo push token** → store it on the user's Supabase profile
  (`push_tokens` table) → a server job / `/api/cron/notify` (already exists!) sends via Expo's push
  API when a relevant event fires (kickoff alert, goal for a followed team, prediction result).
- The existing `useNotifications.ts` hook and `/api/cron/notify` route are the seams — they get a new
  native delivery path; the business logic is already there.
- **iOS requires the APNs key** uploaded to Expo/EAS (generated from your Apple Developer account) —
  set up in P5.

---

## 9. Traffic & analytics — counting visitors on web AND app

You want to track how many people come to the website and the app. Here's the unified plan so **web +
mobile traffic live in one dashboard** and you can compare/total them.

### 9.1 Single source of truth: PostHog (covers both)
- **One PostHog project** instrumented in both `apps/web` and `apps/mobile`. PostHog gives you
  **unique visitors, sessions, pageviews/screen-views, funnels, and retention** — i.e. real "traffic"
  numbers, segmentable by platform (web vs iOS vs Android).
- **Web:** add `posthog-js` to `apps/web` (autocaptures pageviews → web traffic / unique visitors).
- **Mobile:** add `posthog-react-native` to `apps/mobile` (captures screen views + custom events →
  app traffic / DAU/MAU).
- **Identity stitching:** call `posthog.identify(userId)` after sign-in on both platforms so a person
  using web and app is counted as **one user**, and you can see cross-platform behavior. Anonymous
  visitors are still counted for top-of-funnel traffic.
- **Key traffic dashboards to set up:** Daily/Weekly/Monthly Active (DAU/WAU/MAU) split by platform;
  new vs returning; top screens/pages; sign-up funnel; retention cohorts; which sports/predictions
  drive engagement (feeds Varun's ML roadmap).

### 9.2 Complementary web-only signal (optional but cheap)
- **Vercel Web Analytics** on `apps/web` — one toggle in the Vercel dashboard, privacy-friendly
  pageviews/visitors with zero config. Good sanity check against PostHog's web numbers. (PostHog
  remains the cross-platform source of truth; Vercel Analytics is web-only.)

### 9.3 Store-side install metrics (free, automatic)
- **App Store Connect Analytics** (and Google Play Console later) give **impressions, product page
  views, downloads, installs, and conversion rate** from the store itself — the top of your app
  acquisition funnel, which PostHog can't see (it only starts once the app opens). Watch both.

### 9.4 Privacy note
Declare analytics collection in the **App Privacy** label (§6.5). Configure PostHog as **first-party**
(no ad-network ID sharing) to avoid triggering the ATT prompt.

---

## 10. Observability, OTA & quality gates (all four you selected)

| Tool | Purpose | Where |
| --- | --- | --- |
| **Sentry** (`@sentry/react-native`) | Crash + JS error + performance traces. Essential in a beta where you can't see testers' screens. Upload source maps in the EAS build so stack traces are readable. Tag releases so you can tell which build crashed. | `apps/mobile` (+ Sentry on `apps/web` too, optional) |
| **PostHog** | Product analytics + traffic (see §9) | both apps |
| **EAS Update (OTA)** | Push JS/asset fixes to testers instantly without a new TestFlight build. Pair each native build with an update channel (`preview`, `production`). Native changes (new lib, permissions) still need a full build. | `apps/mobile` |
| **Maestro (E2E) + CI** | Maestro flows for smoke tests (launch → see live scores → sign in). GitHub Actions runs **`packages/core` Vitest on every PR** (your existing tests, now shared) + lint + typecheck, and can trigger EAS preview builds on merge. | repo CI + `apps/mobile` |

> **Detox vs Maestro:** Maestro is dramatically simpler to write/maintain for a two-person team —
> recommend **Maestro** over Detox unless you need Detox's deeper RN integration.

**CI pipeline (GitHub Actions) shape:**
- On PR: install → typecheck → lint → `vitest run` (core) → (optional) Maestro on a cloud device.
- On merge to main: EAS `preview` build + EAS Update to the internal channel.
- Tagged release: EAS `production` build → `eas submit` → TestFlight.

---

## 11. Build & release pipeline (concrete)

1. **Dev loop:** Varun runs `eas build --profile development` once to get a **dev client**, then
   iterates with `npx expo start` (fast refresh on device). No cloud build per change.
2. **Internal testing:** merge → CI → `eas build --profile preview` + `eas update` → internal testers
   get it (and OTA JS fixes instantly).
3. **TestFlight beta:**
   - `eas build --profile production --platform ios`
   - `eas submit --platform ios` → App Store Connect
   - Add build to a **TestFlight internal group** (instant, ≤100 testers) for you/Varun/close
     friends.
   - For wider beta: **external group** (≤10,000) requires a one-time lightweight **Beta App Review**
     per first build of a version; subsequent builds usually clear fast.
4. **Versioning:** semantic app version + auto-incrementing build number (EAS can manage). Tag Sentry
   releases to match.

---

## 12. ML service integration (your side of Varun's model)

Varun builds the model (his doc §B). Your responsibility is the **integration seam** so the app reads
predictions cleanly:

- The Python FastAPI service (Railway/Render) runs **offline training jobs** and **writes predictions
  to a Supabase table** (e.g. `predictions_model` keyed by match id + market). It can also expose a
  `/predict` endpoint for on-demand inference.
- The app/web read predictions via a **new `/api/predictions/model/[matchId]`** route on Vercel (thin
  passthrough to Supabase) — so clients never call the Python service directly and you keep one auth +
  rate-limit boundary.
- **Free vs paid layering** stays intact: the existing `entitlements`/`gating` decides whether a user
  sees the **real model prediction** (paid) vs the **clearly-labeled SAMPLE** (free) — exactly the
  current design rule. The model just supplies the real numbers.
- **Secrets:** the Python service holds its own Supabase **service-role** key (server-side only) to
  write predictions; never expose it to clients.

---

## 13. Timeline & milestones (realistic for a two-person team, part-time)

These are working-week estimates; parallelize where noted. Apple enrollment runs in the background
from day 1.

| Week | You (Ayush) | Varun | Milestone |
| --- | --- | --- | --- |
| 1 | **Start Apple enrollment.** Monorepo + Turborepo; move web to `apps/web`; deploy unchanged. | Reads both plan docs; sets up local env; learns Expo/expo-router. | Web builds from monorepo; Apple enrollment submitted. |
| 2 | Extract `packages/core` + `api-client`; web green on packages. RLS audit. | Scaffolds `apps/mobile` (Expo + expo-router); first EAS dev build on device. | "Hello LiveLeague" runs on a real iPhone. |
| 3 | EAS profiles, TestFlight internal, Sentry + PostHog wiring, EAS Update channels. | Builds nav shell (bottom tabs) + theme port + Home read-only (live scores/ticker) from `packages/core` hooks. | First TestFlight internal build; live scores on device. |
| 4 | Mobile auth seam on API routes (Bearer JWT); SecureStore session; CI (Vitest+lint) green. | Soccer + F1 screens (read-only); pull-to-refresh; loading/empty/error states. | All three screens browsable on device. |
| 5 | Sign in with Apple + Google deep-link OAuth; push token registration; rate limiting. | Auth UI native; follows; predictions UI; friend-league screens. | Signed-in personalized app on device. |
| 6 | Maestro smoke flows; App Privacy label + privacy policy page; external TestFlight Beta Review. | Polish, animations (Reanimated), accessibility, empty/edge states. | **External TestFlight beta to real testers.** |
| 7+ | ML integration seam (`/api/predictions/model`); analytics dashboards. | (Frontend) wire model predictions UI. (ML) V1 Elo/Poisson service live → Supabase. | Predictions visible in app. |
| Later | RevenueCat/IAP; Android (Play Console $25, FCM, internal testing); public launch. | Android styling pass; store assets. | Paid + Android + public launch. |

> Realistic calendar for a **beta in testers' hands: ~6 weeks** part-time, gated mainly by Apple
> enrollment (week 1) and the data-layer extraction (weeks 1–2).

---

## 14. Cost summary (beta → early production)

| Item | Cost | When |
| --- | --- | --- |
| Apple Developer Program | **$99/yr** | now (enrollment) |
| Expo / EAS | Free tier works for beta; **~$0–99/mo** if you need more build concurrency | P2+ |
| Vercel | Existing (Hobby/Pro) | unchanged |
| Supabase | Existing free/Pro tier | unchanged |
| Python ML host (Railway/Render) | **~$5–20/mo** small instance | P7 |
| Sentry | Free tier fine for beta | P5 |
| PostHog | Generous free tier | P5 |
| ML data | **$0** (free sources + scraping) | P7 |
| Google Play (Android) | **$25 one-time** | Android phase |
| RevenueCat | Free under ~$2.5k/mo revenue | production |
| **Beta total** | **~$99 + a few $/mo** | — |

---

## 15. Android roadmap (planned now, built later)

Because we chose Expo, Android is **largely the same codebase**. When you're ready:
1. Google Play Console account (**$25 one-time**).
2. EAS `production` Android build (`.aab`), `eas submit --platform android`.
3. **Internal testing track** (Play's TestFlight equivalent) → closed → open testing.
4. Swap APNs-only bits: push goes via **FCM** (Expo handles both).
5. Payments: add **Google Play Billing** (RevenueCat covers it with the same integration).
6. **Data Safety form** (Play's privacy label) — analogous to Apple's App Privacy.
7. Android styling/QA pass (status bar, back button, density, fonts) — Varun's doc §A.10.

The plan is structured so **nothing iOS-specific blocks Android** — all platform-specific code lives
behind Expo's cross-platform APIs.

---

## 16. Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Apple enrollment delay blocks everything | Start day 1; do all non-iOS work (monorepo, packages, Android-agnostic UI) in parallel. |
| Data-layer extraction breaks web | Mechanical refactor PR, tests must stay green, no behavior change; review carefully. |
| Free feed quotas hit by app traffic | Rate-limit `/api/*`, cache aggressively (already done server-side), monitor in PostHog. |
| Apple rejects for "Sign in with Apple" missing | Implement it before submission (§6.4) — it's a known requirement since you offer Google. |
| Apple rejects "looks like a website" | Expo native UI (not a webview) + native nav/gestures avoids this; Varun's doc enforces native patterns. |
| Gambling-category scrutiny | Frame predictions as entertainment, no real-money wagering/payouts (§6.5). |
| Secret leakage in app bundle | Only public keys in the app; all secrets server-side (§6.1). |
| Logic drift between web & mobile | Shared `packages/core` is the single source of truth; both import it. |

---

## 17. Your immediate next actions (this week)

1. **Today:** start **Apple Developer enrollment** (individual, $99) — it's the long pole.
2. **This week:** stand up the **monorepo**, move web to `apps/web`, confirm Vercel deploy unchanged.
3. Create **`packages/core`** + move the portable TS + tests; get web green importing from it.
4. Create the **PostHog project** (web + mobile keys) and add `posthog-js` to web now (start counting
   web traffic immediately, before mobile even exists).
5. Hand Varun `docs/VARUN_MOBILE_AND_ML_PLAN.md` and grant him App Store Connect + repo access.
```

