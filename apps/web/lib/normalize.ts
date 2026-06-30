import type { Match, MatchStatus } from "@liveleague/core/types";
import type { ApiMatch, TeamRef } from "@liveleague/core/api-shape";
import { TEAMS } from "@/data/teams";

// ---- name -> code index (built once) ----
const NAME2CODE: Record<string, string> = {};
function norm(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z]/g, "");
}
for (const code of Object.keys(TEAMS)) {
  NAME2CODE[norm(TEAMS[code].name)] = code;
  NAME2CODE[norm(code)] = code;
  for (const a of TEAMS[code].alias || []) NAME2CODE[norm(a)] = code;
}
export function codeFromName(name: string): string | null {
  return NAME2CODE[norm(name)] || null;
}

// ---- upstream status string -> our status + minute label ----
export function parseStatus(s: string | undefined): { st: MatchStatus; min: string | null } {
  const raw = (s || "").trim();
  const u = raw.toUpperCase();
  if (["MATCH FINISHED", "FT", "AET", "PEN", "AFTER ET", "AFTER PEN.", "FINISHED", "FULL TIME"].includes(u))
    return { st: "ft", min: null };
  if (["NS", "NOT STARTED", "SCHEDULED", "TBD", "TBC", "POSTP", ""].includes(u))
    return { st: "sched", min: null };
  const min = /HT|HALF/i.test(raw) ? "HALF" : /^\d/.test(raw) ? raw + "'" : u;
  return { st: "live", min };
}

// Upstream event shape we care about (TheSportsDB v1 eventsseason).
export type RawEvent = {
  strHomeTeam?: string;
  strAwayTeam?: string;
  intHomeScore?: string | number | null;
  intAwayScore?: string | number | null;
  strStatus?: string;
  strProgress?: string;
  strTimestamp?: string;
  espnId?: string; // ESPN event id (only set by the ESPN parser)
  venue?: string; // authoritative venue name (ESPN)
  pens?: { home: number; away: number }; // shootout result (knockout decided on pens)
};

// A football match can only plausibly be "live" within this window after
// kickoff: 90' + halftime + stoppage + (knockout) extra time + penalties + buffer.
const MAX_LIVE_MS = 3.5 * 60 * 60_000;
const PRE_LIVE_MS = 10 * 60_000; // small lead-in tolerance before the listed kickoff

// Clamp an upstream "live" status against the clock. The free feed often leaves a
// stale "live"/minute on a match that finished hours ago (or before kickoff).
export function clampLive(
  st: MatchStatus,
  kickoffMs: number,
  hasScores: boolean,
  now: number,
): MatchStatus {
  if (st !== "live" || Number.isNaN(kickoffMs)) return st;
  if (now < kickoffMs - PRE_LIVE_MS) return "sched"; // hasn't kicked off yet
  if (now > kickoffMs + MAX_LIVE_MS) return hasScores ? "ft" : "sched"; // long over
  return "live";
}

// Merge upstream events onto a fresh copy of the schedule, matched by team pair.
// `now` is injectable for testing. The status from the free feed is sanity-checked
// against the clock — it often leaves a stale "live"/minute on a match that
// finished hours ago, which is the source of "6pm game shown live at 11pm".
export function applyEvents(
  matches: Match[],
  events: RawEvent[],
  now: number = Date.now(),
): { matches: Match[]; liveCount: number } {
  const byPair = new Map<string, Match>();
  for (const m of matches) {
    byPair.set(m.h + ">" + m.a, m);
    byPair.set(m.a + ">" + m.h, m);
  }
  let liveCount = 0;

  for (const ev of events) {
    const hc = codeFromName(ev.strHomeTeam || "");
    const ac = codeFromName(ev.strAwayTeam || "");
    if (!hc || !ac) continue;
    const m = byPair.get(hc + ">" + ac);
    if (!m) continue;
    const flip = m.h !== hc; // upstream listed teams reversed vs our schedule

    // Resolve kickoff FIRST so the live-window guard uses the real start time.
    if (ev.strTimestamp) {
      const iso = ev.strTimestamp.replace(" ", "T").replace(/Z?$/, "Z");
      if (!Number.isNaN(Date.parse(iso))) { m.utc = iso; m.approx = false; }
    }

    // Remember the ESPN event id so we can pull rich match detail later.
    if (ev.espnId) m.espnId = ev.espnId;
    // Prefer ESPN's (current, sponsored) venue name over the static snapshot.
    if (ev.venue) m.ven = ev.venue;

    const ps = parseStatus(ev.strStatus || ev.strProgress);
    let hs = coerce(ev.intHomeScore);
    let as = coerce(ev.intAwayScore);
    if (flip) { const t = hs; hs = as; as = t; }

    // Clamp an implausible "live" to the clock.
    const st = clampLive(ps.st, new Date(m.utc).getTime(), hs != null && as != null, now);

    m.st = st;
    (m as Match & { minute?: string | null }).minute = st === "live" ? ps.min : null;
    if (st === "sched") { m.hs = null; m.as = null; }
    else { m.hs = hs; m.as = as; }

    // Shootout result (flip-aware), only meaningful once finished.
    const pens = ev.pens && st === "ft"
      ? (flip ? { home: ev.pens.away, away: ev.pens.home } : ev.pens)
      : null;
    (m as Match & { pens?: { home: number; away: number } | null }).pens = pens;

    if (st === "live") liveCount++;
  }
  return { matches, liveCount };
}

function coerce(v: string | number | null | undefined): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : parseInt(v, 10);
  return Number.isNaN(n) ? null : n;
}

// ---- serialize Match -> ApiMatch (resolve team refs) ----
function teamRef(code: string, grp: string | null): TeamRef {
  const t = TEAMS[code];
  return {
    code,
    name: t ? t.name : code,
    flag: t ? t.flag : "",
    color: t ? t.color : "#5b6b60",
    real: !!t,
    grp: t ? t.grp : grp,
  };
}

export function toApiMatch(m: Match): ApiMatch {
  const minute = (m as Match & { minute?: string | null }).minute ?? null;
  const pens = (m as Match & { pens?: { home: number; away: number } | null }).pens ?? null;
  return {
    n: m.n,
    stage: m.stage,
    grp: m.grp,
    home: teamRef(m.h, m.grp),
    away: teamRef(m.a, m.grp),
    venue: m.ven,
    city: m.city,
    country: m.ctry,
    utc: m.utc,
    approx: m.approx,
    status: m.st,
    homeScore: m.hs,
    awayScore: m.as,
    minute: m.st === "live" ? minute : null,
    pens,
  };
}
