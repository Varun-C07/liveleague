import type { Match } from "@liveleagues/core/types";
import { VENUES } from "@/data/venues";
import { isRealTeam } from "@/data/teams";
import { codeFromName, type RawEvent } from "@/lib/normalize";

// Knockout slots ship as placeholders ("2A", "1F", "W74", "3rd A/B/C/D/F") because
// the matchups aren't known until results come in. Our static bracket *structure*
// doesn't necessarily mirror FIFA's real draw, and shootout winners can't be read
// off the score — so the live feed (ESPN) is the only reliable source of the actual
// matchups. ESPN can't be matched by team pair (our slots are placeholders), so we
// match each knockout slot to its ESPN event by VENUE + nearest kickoff, then copy
// the real teams in. Once a slot has real teams, applyEvents() fills its score by
// team pair like any other match — so the bracket fills in round by round as games
// are decided.

const normVenue = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

// our stadium name → venue key
const NAME_TO_KEY: Record<string, string> = {};
for (const [key, v] of Object.entries(VENUES)) NAME_TO_KEY[normVenue(v.stadium)] = key;

// ESPN uses current (sponsored/renamed) names for some venues — map them back.
const VENUE_ALIAS: Record<string, string> = {
  estadiobanorte: "azt", // Estadio Azteca was renamed Estadio Banorte for 2026
};

export function venueKeyFromName(name: string | undefined): string | null {
  if (!name) return null;
  const n = normVenue(name);
  return VENUE_ALIAS[n] ?? NAME_TO_KEY[n] ?? null;
}

// A knockout slot still needs resolving if either side isn't a real team yet.
function isPlaceholderSlot(m: Match): boolean {
  return !isRealTeam(m.h) || !isRealTeam(m.a);
}

const MATCH_WINDOW_MS = 2 * 86_400_000; // our placeholder kickoff is an estimate

type ParsedEvent = { hc: string; ac: string; vk: string; ts: number };

function parseEvents(events: RawEvent[]): ParsedEvent[] {
  const out: ParsedEvent[] = [];
  for (const e of events) {
    const hc = codeFromName(e.strHomeTeam || "");
    const ac = codeFromName(e.strAwayTeam || "");
    const vk = venueKeyFromName(e.venue);
    if (!hc || !ac || !vk || !isRealTeam(hc) || !isRealTeam(ac)) continue;
    const iso = (e.strTimestamp || "").replace(" ", "T").replace(/Z?$/, "Z");
    const ts = Date.parse(iso);
    if (Number.isNaN(ts)) continue;
    out.push({ hc, ac, vk, ts });
  }
  return out;
}

// Fill knockout slots' teams from the live feed. Mutates `matches`; returns how many
// slots were newly resolved (so the caller can re-run applyEvents to pull scores).
export function resolveKnockoutTeams(matches: Match[], events: RawEvent[]): number {
  const evs = parseEvents(events);
  if (!evs.length) return 0;

  let changed = 0;
  for (const m of matches) {
    if (m.grp !== null || !isPlaceholderSlot(m)) continue; // knockout placeholders only
    const vk = venueKeyFromName(m.ven);
    if (!vk) continue;
    const ko = Date.parse(m.utc);
    if (Number.isNaN(ko)) continue;

    let best: ParsedEvent | null = null;
    let bestDiff = Infinity;
    for (const e of evs) {
      if (e.vk !== vk) continue;
      const diff = Math.abs(e.ts - ko);
      if (diff <= MATCH_WINDOW_MS && diff < bestDiff) {
        best = e;
        bestDiff = diff;
      }
    }
    if (best && (m.h !== best.hc || m.a !== best.ac)) {
      m.h = best.hc;
      m.a = best.ac;
      changed++;
    }
  }
  return changed;
}

// Dates (YYYY-MM-DD, UTC) to poll so upcoming/just-decided knockout matchups resolve
// promptly — the slot's estimated day plus neighbours (our placeholder time can be
// off by a few hours / a day). Window: yesterday → `aheadDays` out.
export function unresolvedKnockoutDates(matches: Match[], now: number, aheadDays = 2): string[] {
  const out = new Set<string>();
  const day = 86_400_000;
  const ymd = (ms: number) => new Date(ms).toISOString().slice(0, 10);
  for (const m of matches) {
    if (m.grp !== null || !isPlaceholderSlot(m)) continue;
    const ko = Date.parse(m.utc);
    if (Number.isNaN(ko)) continue;
    if (ko < now - day || ko > now + aheadDays * day) continue;
    out.add(ymd(ko - day));
    out.add(ymd(ko));
    out.add(ymd(ko + day));
  }
  return [...out];
}
