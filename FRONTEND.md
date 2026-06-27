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

### 2026-06-26 — Home "Live now" (all live games) · paywall toggled OFF
- **Home shows every live game:** `components/design/screens/Home.tsx` gains a
  "Live now" section listing ALL currently-live games across sports (like the World
  Cup board), via new `mapLive()` in `components/design/map.ts`; when anything's live
  the single hero spotlight is dropped so nothing duplicates. `mapUpcoming` is now
  sched-only; the overview carries all live games (not a fixed top-3).
- **Paywall off (reversible):** new `PAYWALL_ENABLED` flag in `lib/gating.ts` (set
  `false`). While off, `useEntitlements` reports everyone fully entitled, so every
  locked surface unlocks (predictor/win-prob, predictions, leagues, follow, pin).
  Paywall promos are hidden: Home "World Cup Bundle" card, account plans (replaced by
  an "Everything's free" note), Fixtures "My teams" $5 tease (now a free follow
  prompt). The Team/Player **placeholder** projection panels are hidden entirely (we
  don't surface fabricated numbers as real) — they return if the flag is flipped back.
- **Match win-prob:** `WinProbSection` now always shows the real model unlocked while
  the paywall is off (with calculating/unavailable states), never the sample lock.

### 2026-06-26 — Real win-prob on match page · per-page ticker · fixtures date filter
- **Win probability (match page):** `components/design/screens/Match.tsx` —
  `LockedPredictor` split into `WinProbSection` + a shared `WinProbBar`. Entitled
  ($5-bundle) users now see the **real** Elo+Poisson model (via new `hooks/useWinProb.ts`
  → `/api/soccer/winprob`) unlocked, with an honest "Elo + Poisson · free-data estimate"
  caption and a live-updates note; everyone else keeps the frosted lock over a clearly
  labelled **Sample** (the old `matchPredictor`, re-documented as the sample tease).
- **Ticker scoping:** `ScoreTicker` now takes `active` from `DesignShell` and filters by
  `sportId` — Home shows soccer + F1, `/soccer` soccer only, `/f1` F1 only.
- **Fixtures date filter:** `components/design/screens/soccer/Fixtures.tsx` — new
  "Date" `<Sel>` (All dates · Today · Next 3 days · Next 7 days) using the existing
  `etDay`/`Sel` pattern, combining with View/Stage/Group/Sort.

### 2026-06-26 — Real auth modal + unified match page
- **Auth modal is real now** — `authClient.ts` calls Supabase (email/password +
  Google + live username check); the shell's Sign-in opens it and the avatar
  appears on success. "Check your email" shown when confirmation is required.
- **Unified match page** (`screens/Match.tsx`) — fixtures rows + the featured
  card now **navigate** to `/soccer/match/[id]` (no inline expand). The page
  embeds the real match center (`MatchDetailPanel`: timeline/stats/lineups) + real
  recent form + real head-to-head (ESPN) + real qualification stakes (group
  solver) + the win-prob bundle tease + team links. Pin button stays on the row.

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
### 2026-06-22 — Real squads + captain/GK markers + number-chip faces
- **Real static squads** — new `components/design/screens/team/squads.ts`: ~16 real players each
  for ARG, BRA, FRA, ENG, ESP, POR, GER, NED, USA (real name, position GK/DEF/MID/FWD, shirt
  number, `isCaptain`, `isGoalkeeper`). Wired behind the existing seam: `teamData.ts` `teamSquad()`
  maps real rosters when present, else a clearly-generic placeholder squad. Still one swappable
  `// BACKEND SEAM` module (squads.ts is its dataset).
- **Player type** gained `isCaptain`/`isGoalkeeper` and positions moved to `GK/DEF/MID/FWD`.
- **Captain / GK markers** — new shared `components/design/PlayerTags.tsx`: subtle `(C)` (gold) /
  `(GK)` (muted) chips, shown next to the name in the squad list (`Team.tsx`) and the player header
  (`Player.tsx`). Both can show.
- **Position-realistic stats** (`playerData.ts`): goalkeepers now show Saves + Clean sheets (never
  goals); outfielders show Goals + Assists. `Player.tsx` picks the stat blocks by position.
- **Face fallback** (`Player.tsx` `Avatar`): the header avatar is now the shirt number on the team
  colour with a subtle border (initials fallback) — no broken-image icon, no empty box. No real
  photos are loaded.
- Team page, match-detail, fixtures, standings, home, ticker intact; squad rows still navigate to
  the player page, now with real names + (C)/(GK).

### 2026-06-21 — Player-profile page (real route, deep-linkable)
- **New route** `app/soccer/player/[id]/page.tsx` (loader) → `components/design/screens/Player.tsx`.
  `id` = `${teamCode}-${number}` (e.g. `/soccer/player/BRA-7`); loader validates team + player and
  `notFound()`s otherwise. Native back/forward/share + in-page "← Back to {team}".
- **Squad rows now navigate** — `Team.tsx` `SquadRow` is a `<Link>` to `/soccer/player/{id}` (same
  look; kept `id="player-{id}"` + `.ll-fixture-row` hover).
- **Free content** (tight, complete): header (initials avatar with team-color tint — no broken
  image — name, #number, position, age, club, clickable nationality → team page) and a clean 6-stat
  tournament row (Apps · Mins · Goals · Assists · Yellow · Red; position-realistic, no empty slots).
- **Paid tease**: "Analysis" (form rating, influence, projected impact, note) behind the shared
  premium dark+gold `LockedPanel` (lock + "Unlock with the bundle" → /account). Not yellow.
- **Seam** `components/design/screens/player/playerData.ts` (`// BACKEND SEAM`): `getPlayer(id)`
  (bio + stats, built on `teamSquad` so name/pos/age match the squad row; a GK shows 0 goals) and
  `playerAnalysis(player)`. Page reads only from the seam. Team page, match-detail, fixtures,
  standings, home, ticker all intact.

### 2026-06-21 — Team-profile page + shared premium lock (yellow swept)
- **New route** `app/soccer/team/[id]/page.tsx` (loader) → `components/design/screens/Team.tsx`.
  `id` = the FIFA team code (e.g. `/soccer/team/BRA`); loader `notFound()`s unknown codes, seeds
  matches + standings, screen polls (`useMatches`/`useStandings`). Native back/forward/share +
  in-page "← Back to fixtures".
- **Free content** (themed `t.*`): header (flag/name/group/standing + points + last-5 form),
  full match history (each row → match-detail, with H/A + result-colored score or kickoff), and a
  **squad list** whose rows are click-ready (`id="player-{id}"`, `.ll-fixture-row` cursor+hover) for
  a future player route — not built now.
- **Paid tease**: "Prediction & analysis" (qualify %, projected finish, title odds) behind the
  premium dark+gold glass.
- **Shared lock** — new `components/design/LockedPanel.tsx`: the one frosted dark+gold lock
  (real content blurred behind, lock copy + CTA in-flow so it never clips). Match-detail's predictor
  now uses it too (removed its inline copy).
- **Team links wired**: group-standings rows (`GroupCard`) and the match-detail header (`Side`,
  real teams only) link to `/soccer/team/{code}` via new `.ll-team-link`. Team-history rows link to
  match-detail. (Fixture rows stay single match links — no nested anchors.)
- **Yellow swept**: `Predict.tsx` `Paywall` restyled from `carbon(t.gold)` cross-hatch to the
  premium dark+gold treatment (same CTA/behavior); removed unused `carbon`/`INK`. No caution-tape
  lock surfaces remain.
- **Seam** `components/design/screens/team/teamData.ts` (`// BACKEND SEAM`): squad + analysis,
  deterministic from the real code (generic placeholder names, no wrong-team values). History +
  standing come from real data. Match-detail, fixtures, standings, sidebar, home, ticker intact.

### 2026-06-21 — Match-detail page (real route, deep-linkable)
- **New route** `app/soccer/match/[id]/page.tsx` (loader) → `components/design/screens/Match.tsx`.
  `id` = the match number (`ApiMatch.n`); loader finds it in `liveMatchesResponse()`, `notFound()`s
  on miss, seeds the screen which keeps it live by polling `/api/soccer` (`useMatches`). Native
  back/forward/share/deep-link; plus an in-page "← Back to fixtures" link.
- **Free content** (themed `t.*`): header (flags/names, stage, venue, kickoff; live → live score +
  ticking minute + pulsing dot via the existing motion primitives; FT → final + FT), last-5 form
  W/D/L chips per team, head-to-head, and a "what's at stake" line.
- **Paid tease**: real win-probability bar + predicted scoreline rendered then **frosted/blurred**
  with a premium dark+gold lock overlay ("Unlock with the bundle", `/account` CTA) — predictor is
  visibly there, just locked. Not the yellow box.
- **Data seam** `components/design/screens/match/matchData.ts` — ONE module
  (`// BACKEND SEAM: replace with Supabase/real data`) for form / H2H / predictor / stakes;
  deterministic placeholders derived from the real team codes (no wrong-team names). Component
  reads only from the seam.
- **Navigation wired**: fixture rows are now `<Link>`s to `/soccer/match/{n}` (same look, hover-ready
  already); home featured/upcoming + ticker soccer items deep-link too via new `soccerMatchHref()`
  in `map.ts` (F1 unchanged; dev demo match falls back to `/soccer`). Updated 3 map tests for the
  new hrefs. Soccer board, fixtures, standings, sidebar, ticker, live behavior all intact.

### 2026-06-21 — World Cup fixtures: filterable, date-collapsed system
- **Rebuilt `components/design/screens/soccer/Fixtures.tsx`** from a flat 104-match scroll into a
  control bar + collapsible date/group sections. All filtering is data-driven off `ApiMatch`
  (`utc`→ET day, `grp` A–L, `stage` codes R32/R16/QF/SF/Final, team `code`/`name`).
  - **Default view = Today** (was All); empty today → next matchday with a
    "No matches today — showing [date]" note. All-104 is one tap (`All` chip).
  - **Control bar:** primary chips `Today · All · Live · My teams` (live-count badges) + three
    styled native selects — **Stage** (All/Group stage/R32/R16/QF/SF/Final, with counts), **Group**
    (A–L jump, with counts), **Sort** (Date/Group/Team). Folded the old Group stage/Knockout chips
    into the richer Stage select (superset) to stay elite, not a button pile.
  - **Collapse by date** (or group, per sort): section headers use the design-system bar + uppercase
    `.disp` treatment; today's section open, others collapsible (XOR toggle state).
  - **My teams** reads a new seam `components/design/soccer/followedTeams.ts`
    (`// BACKEND SEAM: replace with real followed-teams from Supabase`, returns empty). Empty →
    premium dark+gold **bundle tease** ("Follow up to 4 teams", `/account` CTA) — not the old yellow box.
  - Rows unchanged in design but now carry `id="match-{n}"` + `.ll-fixture-row` hover lift
    (`GlobalStyle.tsx`), ready for match-detail routing next session (no routing built here).
- `Soccer.tsx`: dropped the now-unused `favSet` prop on `<Fixtures>` (favorites still feed
  GroupCard/results). Featured card, standings, sidebar, live behavior, ticker all untouched.

### 2026-06-21 — Motion (motion/react): data-driven live signals
- **Added `motion` (12.x) dependency** — first use of Framer Motion. New
  `components/design/motion.tsx` with restrained, reduced-motion-aware primitives: `LiveDot`
  (soft 1.5s breathing dot), `TickingMinute` (fade-flash on each minute change), `FlashScore`
  (sport-accent flash ~600ms on score change, then settles), `LiveCardGlow` (faint 3.2s breathing
  edge-ring). All short, ease-out, event-driven; every one degrades to static under
  `prefers-reduced-motion`.
- **Data-driven** — hero (`screens/Home.tsx`) and ticker (`ScoreTicker.tsx`) read live state from
  the existing `["overview"]` data via the demo seam (`withDemoLive` + `useDemoNow`, see
  BACKEND.md). Motion fires ONLY for `status==="live"` items; upcoming/static items are untouched.
  Hero gets the breathing glow + ticking minute + score flash only when the featured match is live.
- **Load ease-in** — the ticker fades/slides in once (~300ms ease-out); hero keeps its existing
  `.rise`. No staggered cascades, no count-ups.
- Flag OFF → no injected live item, no loops, no flashes; page is byte-for-byte as before (only the
  one-time ticker entrance differs, and it's disabled under reduced motion).

### 2026-06-21 — Live score ticker under the nav (every page)
- **New `components/design/ScoreTicker.tsx`** — slim (42px) strip under the nav in
  `DesignShell.tsx`, on every route. Dark `t.surface` + bottom border, items separated by thin
  dividers; each shows flag(s) + codes + score (soccer) or `R{round}` + GP name (F1), with a
  `t.live` dot + minute for live items vs a muted time for upcoming. Items are `<Link>`s to the
  sport page (`/soccer` `/f1`) with a `var(--surfHi)` hover.
- **Data** — new `useLiveTicker()` in `hooks/useLive.ts` reuses the home page's `["overview"]`
  query (shared cache on Home, same `/api/live` aggregate elsewhere — no new fetch). New
  `mapTicker(ov)` in `map.ts`: live + scheduled (skip final), live-first then soonest; falls back
  to upcoming so it's never empty.
- **Motion** — CSS marquee (`@keyframes lltick`, duplicated track, `translateX(-50%)`), but only
  when items overflow (JS measures set width vs container; static & centered if they fit). Slow
  (~6s/item, linear), pauses on hover, and `prefers-reduced-motion` disables auto-scroll (manual
  overflow-scroll instead).
- Tests: +3 `mapTicker` cases (grouping, live-first, score/round) — 76 pass.

### 2026-06-21 — Home copy rewrite + accent (lime) discipline
- **Copy (`screens/Home.tsx`)** — sells the verb + the live WC moment:
  - Eyebrow "Your sports day" → **"The tournament is live"** (uppercase eyebrow).
  - Headline "Every league that matters. One board." → **"Predict the World Cup. Beat your
    friends."** (leads with the action + the social hook, the actual viral loop).
  - Subcopy → **"Make your picks, run a private league with friends, and follow your teams live —
    World Cup and Formula 1."** (verb-led, not a feature list). Bundle value line unchanged.
- **Accent discipline** — lime (`t.accent`) was on nav pill, ON NOW, section bars/dots, CTAs,
  league bars, headline word. Reserved it for **actions + live signals** only:
  - Headline highlight word: lime → white (rewritten, no colored word).
  - `SL` section-header bar (`primitives.tsx`, shared): lime → `t.textDim` (calms section labels
    on Home/Soccer/F1 consistently).
  - "World Cup" `SubLabel` dot + the World Cup league accent bar (desktop + mobile): → `t.textDim`.
    **F1 red kept** (sport identity); removed the now-unused `soccerAccent`.
  - Kept lime on: hero "Open World Cup" CTA, mobile "Open {league}" CTA, active nav pill, and the
    live signals (ON NOW tag, live rings/pulses via `t.live`). Shell otherwise untouched.

### 2026-06-21 — Restyle the $5 Bundle as a premium dark card
- **Dropped the yellow cross-hatch** (`carbon(t.gold)` fill / caution-tape look) — `screens/Home.tsx`.
  The bundle now sits on the Obsidian dark surface (`t.surfaceHi → t.surface` gradient) with gold
  used only as a **restrained accent**: a thin `hex(t.gold,0.45)` hairline border, a faint gold
  top-corner glow, the `$5` price, and the CTA fill — never a background wash.
- **Contained, composed card** — max-width 760, centered (not full-bleed). Hierarchy: title +
  value line (copy unchanged) on the left; the gold **`$5`** as the focal element with a single
  gold primary CTA ("Get the bundle", dark text on gold) directly beneath it on the right.
- Removed the now-dead `carbon` import and the `INK` constant (and the last `hex("#000")`); all
  colors are theme tokens now, so it reskins with the palette and reads as the most premium
  surface on the page, consistent with the F1 board.

### 2026-06-21 — Rebuild Home "Upcoming" (sport subsections, de-noised cards)
- **Renamed "Live & upcoming" → "Upcoming"** — `screens/Home.tsx` (kept the `SL` accent-bar
  header). Live matches dropped from this section (already spotlighted in the hero featured card),
  so no duplication.
- **Split into two sport subsections** — "World Cup" then "Formula 1", each with a new `SubLabel`
  (sport-colored dot + name, smaller than `SL`); each is its own `.ll-fill` grid so soccer and F1
  never interleave. Sorted soonest-first by `utc`. Driven by new `mapUpcoming(ov, excludeKey)` in
  `map.ts` (groups by `s.id`, drops finals + the hero match by key, keeps stray live flagged).
- **De-noised cards (no sport glyphs):** soccer cards lost the crosshair icon — flags + codes +
  group label carry them; F1 cards lost the checkered flag and now lead with the **round number**
  ("R8", `.disp`, in the F1 red accent) as the hero element. Time/round label stays top-right.
- **Empty states** — `EmptyRow` (dashed, themed) shows "No upcoming World Cup / Formula 1 right
  now." instead of a blank gap when a subsection has zero items.
- Removed the now-dead `slateIcon` + `IconSoccer`/`CheckeredFlag` imports from Home (icons remain
  exported). Tests: added 4 `mapUpcoming` cases (grouping, hero-exclusion, round/`vs`, sort) — 73 pass.

### 2026-06-21 — Unify match/league cards (flags, accent bars, F1 rail icon)
- **Country flags in team badges** — `components/design/primitives.tsx` (`Crest`) now renders
  the country flag in a circular crop (Apple Sports look) via the circle-flags SVG set, keyed by
  FIFA code through a new `components/design/flags.ts` map (incl. home nations: ENG→gb-eng,
  SCO→gb-sct, +WAL/NIR). Falls back to the colored disc + 3-letter code when a flag isn't
  mapped or the image fails (`onError`), so a badge is never blank. One change covers every
  soccer badge (Home featured/slate/your-teams, LiveMatch, Fixtures, GroupCard, Predict, Soccer).
  Flags are `<img>` from jsDelivr (no new dependency; mirrors the ESPN-logo `<img>` pattern).
- **Killed the league-card corner glyphs** — `screens/Home.tsx`: removed the clip-art sport
  icons from the Formula 1 / World Cup cards (desktop + mobile accordion); identity now carried
  by the wordmark + a wider (4px) left accent bar in the sport color, echoing the F1 standings
  color bars. (`leagueIcon` + `IconF1` import removed.)
- **Upgraded the F1 rail icon** — chose option (a): the race-car lozenge → a crisp `CheckeredFlag`
  icon (new in `icons.tsx`), and the soccer cards now lead with a matched `IconSoccer` at the same
  size/weight, so both card types in "Live & upcoming" share one anatomy. Added `sportId` to
  `SlateItem` (`map.ts`) to pick the icon. (Chose (a) over leading F1 with "R8" because (b) would
  diverge F1 from the crest-led soccer cards, undercutting the one-system goal.)

### 2026-06-20 — Polish: page width, background depth, Home hero/rows
- **Wider shared frame** — `GlobalStyle.tsx`: `.wrap` and `.ll-head` `max-width` 1200→1280
  (still `margin:0 auto`, equal 22px gutters). One constant, shared by all three screens
  (Home/Soccer/F1 already render inside `.wrap`), so the whole app keeps one centered frame.
- **Home no longer reads narrow** — `screens/Home.tsx`: the hero now collapses to one
  full-width column when there's no featured match (was a 2-col grid leaving the right ~45%
  blank); "Live & upcoming" changed from a left-aligned `Strip` to a width-filling grid
  (`.ll-fill`, new in `GlobalStyle.tsx`) so the day's games span the frame. ("Your teams"
  stays a scrollable rail by design.)
- **Background depth** — `theme.tsx`: added a barely-perceptible accent glow anchored to the
  top corners (radial `t.accent` + `t.gold`, ~5–8% opacity, behind the grain) so the canvas
  reads as lit, not a flat void. Reskins with the palette.
- **Verified already in place (no change):** all three screens share `.wrap` (consistent
  frame); every Home section label uses the shared `SL` primitive (accent bar + uppercase
  condensed); Home cards already use `.lift` (hover lift + accent `var(--glow)` ring, ~220ms,
  cursor:pointer).

### 2026-06-20 — Polish: auth modal brand panel + single nav button + shared logo
- **Reverted the nav to a single "Sign in" button** — `components/design/DesignShell.tsx`
  (`ShellAuth`): removed the duplicate primary "Sign up" CTA; the modal keeps both tabs.
  Dropped the now-dead `.ll-auth-secondary` mobile rule (`GlobalStyle.tsx`).
- **Shared logo** — new `components/design/Logo.tsx` (`BrandMark` + `Logo`). The header and the
  modal (brand panel + mobile compact logo) now render the *same* bar-chart + LIVELEAGUE
  wordmark instead of divergent markup / a plain diamond.
- **Redesigned the modal brand panel** — `components/design/auth/AuthModal.tsx`: dropped the
  all-over green wash for an Obsidian gradient (`t.surface → t.bg`) with contained corner energy
  (warm `t.gold` top-right, cool `t.accent` bottom-left), one track-ribbon motif (tarmac +
  dashed accent racing line) bleeding off the edges, and a grounded content block (eyebrow rule
  → headline → subcopy → feature chips). All theme-driven.
- **Fixed Create-account toggle crowding the close button** — form column top padding 34→52px so
  the segmented toggle clears the absolute X on both tabs.

### 2026-06-20 — Feature: auth modal (Sign in / Create account) + backend seam
- **New auth modal**, opened from the nav — `components/design/auth/` (new folder).
  - `authClient.ts` — typed mock backend **seam** (`signInWithEmail`, `signUpWithEmail`,
    `signInWithOAuth`, `checkUsernameAvailability`, `getSession`, `signOut`); every function
    marked `// BACKEND SEAM: replace with Supabase`. ~700ms mock delays; username taken if
    `<3` chars or in `{admin, messi, ronaldo, liveleague}`. UI calls only these functions.
  - `AuthModalProvider.tsx` — context exposing `openAuth(mode)` / `closeAuth()`; renders the
    modal. Other CTAs (Unlock $5, Get the bundle, Join a league) can call `openAuth()` later
    with one line (not wired yet).
  - `AuthModal.tsx` — two-column themed card (brand panel + form), stacking to a full-screen
    sheet ≤720px. Segmented Sign in / Create account toggle; Google + Apple buttons; email +
    password, plus a username field with debounced live availability on the signup tab.
    States: idle / validating / submitting (lime ring spinner) / error / success
    (closes + `console.log`s the mock user — real session is the seam). Focus trap, Esc +
    backdrop close, body scroll-lock, autofocus, aria roles.
- **Nav** — `components/design/DesignShell.tsx`: existing **Sign in** kept (outline) now opens
  the modal; new primary **Sign up** (hero's skewed lime CTA) next to it. Shell wrapped in
  `AuthModalProvider`. Secondary button collapses at ≤640px (only Sign up shows).
- **Styling** — `GlobalStyle.tsx`: added `llspin`/`llfade` keyframes, `.ll-auth-*` layout +
  input-focus classes, and the ≤720px sheet breakpoint. All colors via the theme object `t.*`
  (Google's mark keeps its brand colors; everything else reskins with the palette).
- Additive only; dormant system (`components/shell/`, `app/globals.css` tokens) untouched.

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
