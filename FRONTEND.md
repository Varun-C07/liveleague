# FRONTEND.md — Front-end Change Log

A running log of front-end (UI/UX) changes made to Live League, with timestamps,
so any session can pick up the thread of what's been touched and why.

**How to use this file**
- Add a new entry at the **top** of the log (newest first) for each front-end change.
- Use the format below. Keep entries short: what changed, where, and why.
- Timestamp format: `YYYY-MM-DD HH:MM TZ` (use the runtime clock).
- Link files with relative paths, e.g. `components/design/screens/Home.tsx`.
- This tracks **front-end work only** — see git history for the full record.

---

## Log

### 2026-06-26 — World Cup: all live matches, pin-to-top, stat/venue fixes
- **Live now shows every simultaneous live match** (not just one) —
  `components/design/screens/Soccer.tsx` renders each live `LiveMatch` (falls back
  to the next scheduled when none are live).
- **Pin a favourite match** — `PinButton` (star) on `LiveMatch` + each
  `FixtureRow`, signed-in only; the pinned match renders in a "Pinned" section at
  the top of the board. Persists via the profile, gone when signed out.
- **Match detail fixes** — pass accuracy now shows real values (was 1%/1%);
  venue names corrected to ESPN's current/sponsored names.

### 2026-06-25 18:24 EDT — F1 Race Center popup (Apple-style modal)
- **New reusable `Modal`** — `components/design/Modal.tsx`: dimmed + blurred
  backdrop (`llfade`) with a spring-in card (`llpop`, scale .94→1 on a snappy
  cubic-bezier), Esc / backdrop / ✕ close, body scroll lock. Keyframes added to
  `GlobalStyle.tsx`.
- **`RaceDetailPanel`** — `components/design/screens/f1/RaceDetailPanel.tsx`
  (via `useRaceDetail` → `/api/f1/race/[id]`): header (GP · circuit · date · round
  + fastest lap), full **classification** (grid→finish delta, gap, points,
  DNF/DNS badges, ⚡ fastest-lap flag), **qualifying** grid, and a **pit-stop**
  summary.
- **`F1.tsx`** — calendar `RaceNode`s and the next-race card now open the modal
  (`openRound` state); the strip keeps a compact podium preview.

### 2026-06-25 17:51 EDT — Match Center panel (timeline · stats · lineups)
- **New `MatchDetailPanel`** — `components/design/screens/soccer/MatchDetailPanel.tsx`.
  Expandable, in-design-language match center backed by `useMatchDetail` →
  `/api/soccer/match/[id]` (real ESPN data, stored per-match): venue/attendance/
  referee meta, a goal/card/sub **timeline** (scorer names + descriptions,
  side-coloured), home-vs-away **stat bars** (possession, shots, passes, …), and
  **real lineups** rendered on a mini-pitch from the formation string (XI-list
  fallback).
- **Wiring** — `LiveMatch.tsx` expands into the panel (replacing the old sample
  formation + win-probability); `Fixtures.tsx` `FixtureRow` is now tap-to-expand
  for any live/finished game (chevron), so past games open their detail inline.
- **Removed** the sample bits `screens/soccer/{charts,sample}.tsx`.
- **Why:** the user wanted a descriptive, browsable match center for live + past
  games. Live panels poll; finished games load once from the DB.

### 2026-06-19 22:31 EDT — Fix (real): mobile menu button overlapping Sign in
- **Mobile header now reclaims width** — `components/design/DesignShell.tsx` + `GlobalStyle.tsx`.
  - Root cause (verified via Playwright screenshots at 360–414px): on `/soccer` & `/f1`
    the collapsed menu button ("World Cup ⌄" / "Formula 1 ⌄") is wide, the "LIVELEAGUE"
    wordmark ate the rest of the row, so the nav wrapper shrank below the button and the
    button — which can't be clipped (its dropdown must overflow) — spilled over Sign in.
  - Fix: at ≤640px hide the logo wordmark (`.ll-logo-word`, bars mark still links home),
    hide the account name (`.ll-acct-name`, avatar only), and tighten header gap/padding
    (`.ll-head` 16→9 gap, 22→14 px). Verified no overlap at 360/375/390/414 on Home,
    soccer, and F1; desktop keeps the full wordmark + inline pills.
  - Note: the 20:29 entry below fixed the *desktop* overlap; this fixes the *mobile* one
    the user actually hit (screenshot).
- Verified: `tsc` + `eslint` + `npm test` (69) pass; visual checks via headless Chromium.

### 2026-06-19 20:29 EDT — Fix: nav pills overlapping the sign-in button
- **Header layout hardened** — `components/design/DesignShell.tsx` + `GlobalStyle.tsx`.
  - `Nav` now renders as a single bounded flex child (`flex:1; min-width:0`) instead of
    two sibling flex items; the desktop pills row clips + scrolls internally
    (`.ll-nav-pills` `overflow-x:auto`, scrollbar hidden) rather than growing into the
    right-side controls.
  - Pinned the bell and the sign-in / account control with `flexShrink:0` so they keep
    their size and can never be overlapped by the nav.
- **Why:** after the 19:16 nav change, on tight desktop widths the World Cup / Formula 1
  pills competed for space with the Sign in button and visually collided.
- Verified: `tsc` + `eslint` pass; dev server recompiles and serves 200.

### 2026-06-19 19:16 EDT — Header nav collapses to a single menu on mobile
- **Top nav (Home / World Cup / Formula 1) is now responsive** — `components/design/DesignShell.tsx`.
  - Desktop (>640px): unchanged inline pills (`.ll-nav-pills`).
  - Mobile (≤640px): the three pills collapse into one tap-to-open menu
    (`.ll-nav-menu`) — a single button showing the current section that expands a
    vertical dropdown to switch between Home / World Cup / Formula 1. Closes on
    outside click and on route change.
  - Extracted the nav into a `Nav` component; chevron rotates when open.
- **Responsive CSS** — `components/design/GlobalStyle.tsx` (`.ll-nav-pills` /
  `.ll-nav-menu`, switch at a new 640px breakpoint).
- **Why:** the three header pills were squeezed next to the logo on mobile; a single
  collapsible menu replaces them. (Distinct from the 16:37 change, which collapsed the
  in-page "Leagues" section — that stays as-is.)
- Verified: `tsc --noEmit` + `eslint` pass; dev server serves both nav layouts (SSR
  confirmed `.ll-nav-pills`, `.ll-nav-menu`, and the 640px media query in the HTML).

### 2026-06-19 16:37 EDT — Mobile collapsible league bars + logo→home confirmed
- **Home "Leagues" section is now responsive** — `components/design/screens/Home.tsx`.
  - Desktop (>560px): unchanged grid of league cards (`.ll-leagues-cards`).
  - Mobile (≤560px): collapsible vertical accordion bars (`.ll-leagues-acc`); tap a
    bar to expand match count + status + an "Open" CTA into that board. Single
    `openLeague` state; opening one collapses the other; chevron rotates on open.
  - Added `leagueIcon()` helper to share the F1/soccer/emoji glyph between layouts.
- **Responsive CSS + accordion animation** — `components/design/GlobalStyle.tsx`
  (`.ll-leagues-cards` / `.ll-leagues-acc`, `.ll-acc-body` max-height transition,
  `.ll-acc-chev` rotation; switch at the existing 560px breakpoint).
- **Why:** league cards were squeezed / required left-right scrolling on mobile;
  bars let users pick a sport with a tap.
- **Logo → home:** verified already wired — header logo is `<Link href="/">` in
  `components/design/DesignShell.tsx`. No change needed.
- Verified: `tsc --noEmit` and `eslint` pass on the changed files.
