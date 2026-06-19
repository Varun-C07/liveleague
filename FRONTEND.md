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
