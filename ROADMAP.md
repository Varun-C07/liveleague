# Live League — Roadmap & Timeline

The single source of truth for what's been built and what's planned. (Working notes also live
in `~/.claude/plans/`.)

## Shipped (v1 — free, read-only live tracker)

In build order:

1. **Unified multi-sport app.** Rebuilt the FIFA-only board into one Next.js app: home +
   `/f1` `/soccer` `/nba` `/cricket` `/baseball`, on a shared **adapter architecture**
   (`SportAdapter` → normalized `Game`), server-proxied + CDN-cached feeds, per-sport snapshot
   fallback, per-sport accent theming, framer-motion.
2. **Repo + hygiene.** Pushed to `github.com/Ayush-Chaudhary/liveleague` (`main`); removed the
   legacy FIFA static `index.html` + GitHub-Pages workflow; `origin` = liveleague.
3. **Honest live status.** Replaced the misleading "Offline" label with a `reason`
   (`live` / `empty` / `fallback` / `sample`); NBA/MLB empty slate ≠ error; cricket = "Sample data".
4. **Quick Wins:**
   - **My Agenda** (`/agenda`) — cross-sport Today / This Week / This Month + ★ My Teams.
   - **F1 driver profiles** (`/f1/driver/[code]`) — season results + deterministic title math.
   - **Score number-glow** on score changes.
   - **All-sport favorites** (namespaced `sport:code`) + a My Teams board filter.
   - **Vitest** test runner + unit tests for the pure logic.
5. **Live-sync fix.** `clampLive()` guards upstream "live" against the clock (a finished game
   can't show live hours later); soccer `applyEvents` reordered to resolve kickoff first.
6. **Deploy automation.** Token-based Vercel deploy via GitHub Actions, gated on lint + tests.

## Decisions locked in

- **Data:** free-only (Jolpica · TheSportsDB · ESPN · OpenF1). No licensed feeds yet → no live
  xG / heatmaps / lineups / official win-probability until there's a budget.
- **Backend (next phase):** **Supabase** (Postgres data + Auth), **Stripe** (payments).
- **Hosting:** Vercel via GitHub Actions (token-based).
- **Cadence:** unit-test each iteration; commit + push to `main` after each checkpoint.
- **Deferred:** in-app social network; deep NBA stats; cricket stays free/ads (not paid).

## Pending manual actions (owner: you)

- Add GitHub repo secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (see README →
  Deploy), then disconnect the native Vercel Git integration so only the Action deploys.

## Planned (phases)

- **Phase 2 — Backend foundation.** Supabase auth + DB; Stripe + entitlements/feature-gating.
  Replace localStorage favorites with accounts.
- **Phase 3 — Viral free loop.** Prediction game + invite-friends leaderboards; shareable
  "my prediction vs result" OG cards; onboarding (2–3 Qs) + "My Feed" ordered by followed teams.
- **Phase 4 — Retention + acquisition.** AI daily recap (push/email); programmatic SEO pages
  per team/driver/match.
- **Phase 5 — Monetization.** Tournament Pass (one-time ~$5–10); premium World Cup bracket +
  result predictor.
- **Phase 6 — F1 AI race simulator.** Predict finish + points from historical track/venue/
  constructor form (free Ergast/OpenF1 data; modeling-heavy).
- **Phase 7 — Premium live stats** (xG / heatmaps / momentum / official WP). **Blocked on a
  licensed-data budget;** ship transparent approximations until then.

## Backlog (smaller bugs & enhancements)

- **E2 — light/dark theme toggle** (decided: default **auto/system** + persisted toggle; needs a
  light token set in `globals.css` via `[data-theme]`).
- **E1 — active-leagues ordering** on home (decided: sort **Live → Active → Quiet**, keep all
  cards; needs real per-sport live/today counts in `SportSummary`).
- Cricket result text (`extra.note`) and baseball outs (`extra.outs`) are computed but not shown.
- ESPN `address.state` is mislabeled as `country` in `GameRow`.
- Home "Events Today" undercounts (counts only top-3 games per sport).
- Sound toggle is soccer-only; move into the shared `SportHeader`.
- Broken team-logo `<img>` has no `onError`; tickers can show stale finals; favicon/OG still FIFA.
- Converge duplicate components (two flash hooks, two tickers/stat bars/filters: soccer vs shared).
- Real cricket live feed behind `cricketAdapter.getLive()`.
- Accessibility + reduced-motion pass; responsive nav on small screens; PWA; more tests.
