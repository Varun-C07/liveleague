# PLACEHOLDERS.md — what's real vs. placeholder

A living map of which data in Live League is **real** (live free feeds or hand-verified)
and which is **placeholder** (seeded/fabricated, shown only as an illustrative seam until a
real source exists). Pair with **BACKEND.md** (data layer) and **CLAUDE.md** (free-only rule).

Last reviewed: 2026-06-27.

---

## ✅ REAL (trustworthy)

| Data | Source | Where it shows |
| ---- | ------ | -------------- |
| Match scores, status, live minute/stoppage | **ESPN** free scoreboard (`lib/espn-soccer.ts`) | Everywhere |
| Fixture schedule (104 matches), venues, kickoff times | Official 2026 schedule (`data/groupStage.ts`, `data/knockouts.ts`, `data/venues.ts`) | Everywhere |
| Team names, flags, colors, groups | Official draw (`data/teams.ts`) | Everywhere |
| Group standings (P/W/D/L/GF/GA/GD/Pts) | Computed from results (`lib/standings.ts`) | Standings, team page |
| Qualification scenarios / "What's at stake" | Deterministic solver (`lib/group-scenarios.ts`) | Match page |
| Recent form (last 5) — **match page** | ESPN summary (`lib/espn-summary.ts`) | Match page → Recent form |
| Head-to-head — **match page** | ESPN summary | Match page → Head to head |
| Match timeline, team stats, lineups | ESPN summary | Match page → match center |
| **Win probability** | Real Elo + Poisson model (`lib/win-prob.ts`, seeded by `data/eloRatings.ts`) | Match page → Win probability |

> Note: the Elo **seed** values in `data/eloRatings.ts` are approximate public
> pre-tournament ratings (transcribed once); the model then updates them from real
> results. Labeled in-app as a "free-data estimate," not official odds.

---

## 🙈 Visibility

The placeholder surfaces below are **hidden from the UI** by the `SHOW_PLACEHOLDERS`
flag (`lib/gating.ts`, currently `false`) so nothing fabricated is shown as if it were
real. Flip it to `true` to surface them again (design/demo). The paid analysis panels
are separately hidden by `PAYWALL_ENABLED`. What's hidden while `SHOW_PLACEHOLDERS` is
off: generic (non-verified) squads + their player pages, seeded player age/club/stats,
and the seeded team-header form badges.

## ⚠️ PLACEHOLDER (fabricated / seeded — not real)

| Data | File · function | Kind | Where it shows |
| ---- | --------------- | ---- | -------------- |
| **Squad rosters for 39 teams** | `components/design/screens/team/teamData.ts` `teamSquad` (fallback) | Seeded generic names ("A. Andersen"), fixed shape | Team page squad, player page |
| **Squad rosters for 9 teams** (ARG, BRA, FRA, ENG, ESP, POR, GER, NED, USA) | `components/design/screens/team/squads.ts` | **Hand-verified REAL** names/numbers/positions | Team page squad, player page |
| Player **age** | `teamData.ts` `ageOf` | Seeded (19–35) | Squad list, player header |
| Player **club** | `player/playerData.ts` `CLUBS` | Seeded from a 10-item list | Player header |
| Player **tournament stats** (apps, mins, goals, assists, cards, saves) | `player/playerData.ts` `getPlayer` | Seeded, position-realistic | Player page → Tournament |
| Player **analysis** (form rating, influence, impact) | `player/playerData.ts` `playerAnalysis` | Seeded | Player page (hidden while paywall off) |
| Team **analysis** (qualify %, projected finish, title %) | `team/teamData.ts` `teamAnalysis` | Seeded | Team page (hidden while paywall off) |
| Recent form (last 5) — **team page** | `match/matchData.ts` `recentForm` | Seeded | Team page form badges |
| Win-prob **sample** (free-tier tease) | `match/matchData.ts` `matchPredictor` | Seeded, labeled "Sample" | Match page (only when paywall ON, for non-entitled) |
| Demo live match (dev only) | `components/design/demoLive.ts` | Fake, **off by default** | Ticker/hero only if `NEXT_PUBLIC_LL_DEMO_LIVE=1` |

---

## What this means for the player pages

Player pages today are **mostly placeholder** except for the 9 hand-verified squads.
For the other 39 teams the player **names themselves are invented**, and for *all*
teams the age / club / tournament stats / analysis are seeded. To make player pages
fully real we'd need a free source for 2026 squads + per-player stats (none is
currently available under the free-only constraint) — or continue hand-entering
squads team-by-team in `squads.ts` (names/numbers/positions only; stats would stay
placeholder until a feed exists).
