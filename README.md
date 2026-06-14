# FIFA World Cup 2026 — Live Tournament Board

A single-page, self-updating board for the **FIFA World Cup 2026** (USA · Canada · Mexico) —
the first 48-team World Cup, all **104 matches** from the group stage through the final.

🔗 **Live page:** https://ayush-chaudhary.github.io/fifa-2026-liveboard/

## What it shows

- **Next-match countdown** and a live "what's on now" panel
- **Group standings** for all 12 groups (A–L), computed live from results
- **Every match** with venue, host city, match day and **US Eastern kickoff** (EST/EDT handled automatically)
- Filters: All · Live · Completed · Upcoming · Group Stage · Knockouts
- Tournament progress (matches played / 104) and goals scored

## Live data

Scores, live minutes and kickoff times refresh automatically (every 60s) from the
**[TheSportsDB](https://www.thesportsdb.com) free API** — no key, no backend, works as a static page.
Group tables are computed client-side from results, so they stay correct even if the feed is offline.
If the live feed can't be reached, the board falls back to a verified snapshot (data confirmed 14 Jun 2026)
so it's never blank.

## Hosting

The page is a single self-contained `index.html`. It's published with GitHub Pages via the
workflow in `.github/workflows/pages.yml` — no build step.

Built as a companion to the F1 2026 live timing board.
