// Rich per-match detail from ESPN's free `summary` endpoint: goal scorers (with
// descriptions), cards, substitutions, full team stats (possession / shots /
// passes / …), real lineups + formation, venue, attendance and referee.
// Normalized into a compact `MatchDetail` we store in `match_details` and render
// in the expandable match panel (live + past games).
//
// `normalizeSummary` is pure (unit-tested in tests/espn-summary.test.ts);
// `fetchMatchDetail` adds the network call.

const ESPN_SUMMARY =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary";

export type DetailEventKind = "goal" | "yellow" | "red" | "sub";
export type DetailEvent = {
  minute: string; // "43'", "90'+3'"
  kind: DetailEventKind;
  side: "home" | "away" | null;
  player: string | null;
  text: string; // ESPN's descriptive sentence
};

export type StatPair = { key: string; label: string; home: number; away: number; pct?: boolean };

export type LineupPlayer = { jersey: string | null; name: string; pos: string | null };
export type TeamLineup = { formation: string | null; starters: LineupPlayer[] };

export type FormEntry = { date: string; result: "W" | "D" | "L"; score: string; opp: string };
export type H2HEntry = { date: string; score: string; home: string; away: string };

// Penalty shootout, in kick order per side (didScore drives the green/red dots).
export type ShootoutKick = { player: string; scored: boolean };
export type Shootout = {
  home: ShootoutKick[];
  away: ShootoutKick[];
  homeScore: number;
  awayScore: number;
} | null;

export type MatchDetail = {
  status: "sched" | "live" | "ft";
  detail: string | null; // ESPN status detail, e.g. "FT", "66'"
  home: { code: string; name: string; score: number | null };
  away: { code: string; name: string; score: number | null };
  events: DetailEvent[]; // goals + cards + subs, chronological
  stats: StatPair[]; // curated, ordered for display
  lineups: { home: TeamLineup; away: TeamLineup } | null;
  form: { home: FormEntry[]; away: FormEntry[] };
  h2h: H2HEntry[];
  shootout: Shootout;
  venue: string | null;
  attendance: number | null;
  referee: string | null;
  syncedAt: string;
};

type Json = Record<string, unknown>;
const obj = (v: unknown): Json => (v && typeof v === "object" ? (v as Json) : {});
const arr = (v: unknown): Json[] => (Array.isArray(v) ? (v as Json[]) : []);
const str = (v: unknown): string | null => (typeof v === "string" ? v : typeof v === "number" ? String(v) : null);
const num = (v: unknown): number | null => {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  return null;
};

function kindOf(typeType: string, typeText: string): DetailEventKind | null {
  const s = (typeType || typeText || "").toLowerCase();
  if (s.includes("goal")) return "goal"; // goal, own-goal, penalty-goal
  if (s.includes("yellow")) return "yellow";
  if (s.includes("red")) return "red";
  if (s.includes("substitution") || s === "sub") return "sub";
  return null;
}

// Curated stat rows (ESPN stat name → display), in render order.
const STAT_ROWS: { key: string; espn: string; label: string; pct?: boolean }[] = [
  { key: "possession", espn: "possessionPct", label: "Possession", pct: true },
  { key: "shots", espn: "totalShots", label: "Shots" },
  { key: "sot", espn: "shotsOnTarget", label: "Shots on target" },
  { key: "corners", espn: "wonCorners", label: "Corners" },
  { key: "fouls", espn: "foulsCommitted", label: "Fouls" },
  { key: "offsides", espn: "offsides", label: "Offsides" },
  { key: "yellow", espn: "yellowCards", label: "Yellow cards" },
  { key: "passAccuracy", espn: "passPct", label: "Pass accuracy", pct: true },
  { key: "saves", espn: "saves", label: "Saves" },
];

function statMap(team: Json): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of arr(team.statistics)) {
    const name = str(s.name);
    const v = num(s.value) ?? num(s.displayValue);
    if (name && v != null) out[name] = v;
  }
  return out;
}

function lineupOf(team: Json): TeamLineup {
  const starters: LineupPlayer[] = [];
  for (const p of arr(team.roster)) {
    if (!p.starter) continue;
    const a = obj(p.athlete);
    starters.push({
      jersey: str(p.jersey),
      name: str(a.displayName) ?? str(a.shortName) ?? "",
      pos: str(obj(p.position).abbreviation),
    });
  }
  return { formation: str(team.formation), starters };
}

// Pure: ESPN summary JSON → MatchDetail. No I/O (testable).
export function normalizeSummary(j: Json): MatchDetail {
  const comp = obj(arr(obj(j.header).competitions)[0]);
  const competitors = arr(comp.competitors);
  const state = str(obj(obj(comp.status).type).state); // pre|in|post
  const status: MatchDetail["status"] = state === "post" ? "ft" : state === "in" ? "live" : "sched";
  const detail = str(obj(obj(comp.status).type).detail);

  // team id → side / code, plus the score line.
  const idToSide: Record<string, "home" | "away"> = {};
  const idToCode: Record<string, string> = {};
  let home = { code: "", name: "", score: null as number | null };
  let away = { code: "", name: "", score: null as number | null };
  for (const c of competitors) {
    const team = obj(c.team);
    const id = str(team.id);
    const side = str(c.homeAway) as "home" | "away" | null;
    const entry = { code: str(team.abbreviation) ?? "", name: str(team.displayName) ?? "", score: num(c.score) };
    if (id) idToCode[id] = str(team.abbreviation) ?? "";
    if (id && side) idToSide[id] = side;
    if (side === "home") home = entry;
    else if (side === "away") away = entry;
  }

  // events: goals + cards + subs
  const events: DetailEvent[] = [];
  for (const e of arr(j.keyEvents)) {
    const ty = obj(e.type);
    const kind = kindOf(str(ty.type) ?? "", str(ty.text) ?? "");
    if (!kind) continue;
    const teamId = str(obj(e.team).id);
    const athlete = obj(arr(e.participants)[0]).athlete;
    events.push({
      minute: str(obj(e.clock).displayValue) ?? "",
      kind,
      side: teamId ? idToSide[teamId] ?? null : null,
      player: athlete ? str(obj(athlete).displayName) : null,
      text: str(e.text) ?? "",
    });
  }

  // stats + lineups by side
  const bs = obj(j.boxscore);
  const sideStats: Record<"home" | "away", Record<string, number>> = { home: {}, away: {} };
  for (const t of arr(bs.teams)) {
    const side = idToSide[str(obj(t.team).id) ?? ""];
    if (side) sideStats[side] = statMap(t);
  }
  // Pass accuracy: ESPN's `passPct` is an unreliable 0–1 fraction ("0.8"), so
  // derive it from the raw counts instead (accurate / total passes).
  const passAcc = (s: Record<string, number>) => (s.totalPasses ? Math.round((s.accuratePasses / s.totalPasses) * 100) : 0);
  const stats: StatPair[] = STAT_ROWS.map((r) =>
    r.key === "passAccuracy"
      ? { key: r.key, label: r.label, home: passAcc(sideStats.home), away: passAcc(sideStats.away), pct: true }
      : { key: r.key, label: r.label, home: sideStats.home[r.espn] ?? 0, away: sideStats.away[r.espn] ?? 0, pct: r.pct },
  ).filter((s) => s.home !== 0 || s.away !== 0);

  let lineups: MatchDetail["lineups"] = null;
  const sideLineup: Partial<Record<"home" | "away", TeamLineup>> = {};
  for (const t of arr(j.rosters)) {
    const side = idToSide[str(obj(t.team).id) ?? ""];
    if (side) sideLineup[side] = lineupOf(t);
  }
  if (sideLineup.home?.starters.length || sideLineup.away?.starters.length) {
    lineups = {
      home: sideLineup.home ?? { formation: null, starters: [] },
      away: sideLineup.away ?? { formation: null, starters: [] },
    };
  }

  // recent form (last-5) per side, from the team's perspective.
  const form: { home: FormEntry[]; away: FormEntry[] } = { home: [], away: [] };
  for (const tg of arr(j.lastFiveGames)) {
    const side = idToSide[str(obj(tg.team).id) ?? ""];
    if (!side) continue;
    form[side] = arr(tg.events).slice(0, 5).map((e): FormEntry => {
      const away_ = str(e.atVs) === "@";
      const ts = away_ ? num(e.awayTeamScore) : num(e.homeTeamScore);
      const os = away_ ? num(e.homeTeamScore) : num(e.awayTeamScore);
      const r = (str(e.gameResult) ?? "").toUpperCase();
      return {
        date: (str(e.gameDate) ?? "").slice(0, 10),
        result: r === "W" ? "W" : r === "L" ? "L" : "D",
        score: `${ts ?? 0}-${os ?? 0}`,
        opp: str(obj(e.opponent).abbreviation) ?? "",
      };
    });
  }

  // head-to-head meetings (both perspectives list the same games; take the first).
  const h2h: H2HEntry[] = arr(obj(arr(j.headToHeadGames)[0]).events).slice(0, 5).map((e): H2HEntry => ({
    date: (str(e.gameDate) ?? "").slice(0, 10),
    home: idToCode[str(e.homeTeamId) ?? ""] ?? "",
    away: idToCode[str(e.awayTeamId) ?? ""] ?? "",
    score: `${num(e.homeTeamScore) ?? 0}-${num(e.awayTeamScore) ?? 0}`,
  }));

  // penalty shootout (per-kick, in order) — team id maps to our home/away side.
  let shootout: Shootout = null;
  const so: { home: ShootoutKick[]; away: ShootoutKick[] } = { home: [], away: [] };
  for (const t of arr(j.shootout)) {
    const side = idToSide[str(t.id) ?? ""];
    if (!side) continue;
    so[side] = arr(t.shots).map((s) => ({ player: str(s.player) ?? "", scored: !!s.didScore }));
  }
  if (so.home.length || so.away.length) {
    shootout = {
      ...so,
      homeScore: so.home.filter((k) => k.scored).length,
      awayScore: so.away.filter((k) => k.scored).length,
    };
  }

  const gi = obj(j.gameInfo);
  return {
    status,
    detail,
    home,
    away,
    events,
    stats,
    lineups,
    form,
    h2h,
    shootout,
    venue: str(obj(gi.venue).fullName),
    attendance: num(gi.attendance),
    referee: str(obj(arr(gi.officials)[0]).displayName),
    syncedAt: new Date().toISOString(),
  };
}

async function fetchJSON(url: string, revalidate: number): Promise<Json | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate, tags: ["wc-detail"] },
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return (await res.json()) as Json;
  } finally {
    clearTimeout(timer);
  }
}

// `revalidate` short for live matches, long for finished (immutable).
export async function fetchMatchDetail(eventId: string, revalidate = 20): Promise<MatchDetail | null> {
  const j = await fetchJSON(`${ESPN_SUMMARY}?event=${eventId}`, revalidate);
  return j ? normalizeSummary(j) : null;
}
