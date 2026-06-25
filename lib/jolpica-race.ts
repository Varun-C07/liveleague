// Rich per-race detail from the free Jolpica/Ergast API: full classification
// (grid → finish, points, status, fastest lap), qualifying (Q1/Q2/Q3) and a
// pit-stop summary. Normalized into a compact `RaceDetail` we store in
// `match_details` (keyed `f1-<round>`) and render in the race popup.
//
// `normalizeRace` is pure (unit-tested in tests/jolpica-race.test.ts);
// `fetchRaceDetail` adds the network calls.
import { colorForConstructor } from "@/data/snapshots/f1";

const BASE = process.env.JOLPICA_BASE || "https://api.jolpi.ca/ergast/f1/2026";

export type RaceResultRow = {
  pos: number;
  code: string;
  driver: string;
  constructor: string;
  color: string;
  grid: number;
  gained: number; // grid − finishing position (＋ = places gained)
  time: string | null; // winner's total or "+x.xxx" gap
  points: number;
  status: string; // "Finished" | "+1 Lap" | "Collision" | …
  dnf: boolean;
};
export type FastestLap = { code: string; time: string; lap: number } | null;
export type QualiRow = { pos: number; code: string; q1: string | null; q2: string | null; q3: string | null };
export type PitSummary = {
  fastest: { code: string; duration: string; lap: number } | null;
  byDriver: { code: string; best: string; count: number }[];
};

export type RaceDetail = {
  status: "sched" | "ft";
  round: number;
  name: string | null;
  circuit: string | null;
  date: string | null;
  results: RaceResultRow[];
  fastestLap: FastestLap;
  qualifying: QualiRow[];
  pitstops: PitSummary;
  syncedAt: string;
};

type Json = Record<string, unknown>;
const obj = (v: unknown): Json => (v && typeof v === "object" ? (v as Json) : {});
const arr = (v: unknown): Json[] => (Array.isArray(v) ? (v as Json[]) : []);
const str = (v: unknown): string | null => (typeof v === "string" ? v : typeof v === "number" ? String(v) : null);
const int = (v: unknown): number => {
  const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
  return Number.isNaN(n) ? 0 : n;
};

// Pit-stop duration → seconds. Mostly "23.456"; occasionally "M:SS.sss" (e.g. a
// red-flag stop) which must not be parsed as a tiny number.
function parseDuration(s: string | null): number {
  if (!s) return NaN;
  if (s.includes(":")) {
    const [m, sec] = s.split(":");
    return parseInt(m, 10) * 60 + parseFloat(sec);
  }
  return parseFloat(s);
}

function driverCode(dr: Json): string {
  return str(dr.code) || (str(dr.familyName) ? (str(dr.familyName) as string).slice(0, 3).toUpperCase() : "—");
}
function driverFull(dr: Json): string {
  const full = [str(dr.givenName), str(dr.familyName)].filter(Boolean).join(" ");
  return full || driverCode(dr);
}
function race0(raw: Json | undefined): Json {
  return obj(arr(obj(obj(raw).MRData).RaceTable && obj(obj(obj(raw).MRData).RaceTable).Races)[0]);
}

// Pure: the three Jolpica responses → RaceDetail.
export function normalizeRace(
  round: number,
  raw: { results?: Json; qualifying?: Json; pitstops?: Json },
): RaceDetail {
  const rRace = race0(raw.results);
  const qRace = race0(raw.qualifying);
  const pRace = race0(raw.pitstops);

  const resultsRaw = arr(rRace.Results);
  const idToCode: Record<string, string> = {};

  let fastestLap: FastestLap = null;
  const results: RaceResultRow[] = resultsRaw.map((x) => {
    const dr = obj(x.Driver);
    const con = obj(x.Constructor);
    const code = driverCode(dr);
    const did = str(dr.driverId);
    if (did) idToCode[did] = code;
    const pos = int(x.position);
    const grid = int(x.grid);
    const status = str(x.status) ?? "";
    // Ergast positionText: numeric = classified (finished or lapped); R/W/D/E/N
    // = retired / withdrawn / disqualified / excluded / not-classified = DNF.
    const ptext = str(x.positionText) ?? "";
    const dnf = !/^\d+$/.test(ptext);
    const fl = obj(x.FastestLap);
    if (str(fl.rank) === "1") {
      fastestLap = { code, time: str(obj(fl.Time).time) ?? "", lap: int(fl.lap) };
    }
    return {
      pos,
      code,
      driver: driverFull(dr),
      constructor: str(con.name) ?? "",
      color: colorForConstructor(str(con.constructorId) ?? undefined),
      grid,
      gained: !dnf && grid > 0 ? grid - pos : 0,
      time: str(obj(x.Time).time),
      points: int(x.points),
      status,
      dnf,
    };
  });

  const qualifying: QualiRow[] = arr(qRace.QualifyingResults).map((x) => ({
    pos: int(x.position),
    code: driverCode(obj(x.Driver)),
    q1: str(x.Q1),
    q2: str(x.Q2),
    q3: str(x.Q3),
  }));

  // Pit stops → fastest + per-driver best/count.
  const stops = arr(pRace.PitStops);
  const byDriverMap = new Map<string, { best: number; count: number }>();
  let fastest: PitSummary["fastest"] = null;
  let fastestSec = Infinity;
  for (const s of stops) {
    const did = str(s.driverId) ?? "";
    const dur = parseDuration(str(s.duration));
    if (Number.isNaN(dur)) continue;
    const code = idToCode[did] || did.slice(0, 3).toUpperCase();
    const cur = byDriverMap.get(code);
    if (!cur || dur < cur.best) byDriverMap.set(code, { best: dur, count: (cur?.count ?? 0) + 1 });
    else byDriverMap.set(code, { best: cur.best, count: cur.count + 1 });
    if (dur < fastestSec) {
      fastestSec = dur;
      fastest = { code, duration: dur.toFixed(3), lap: int(s.lap) };
    }
  }
  const pitstops: PitSummary = {
    fastest,
    byDriver: [...byDriverMap.entries()]
      .map(([code, v]) => ({ code, best: v.best.toFixed(3), count: v.count }))
      .sort((a, b) => parseFloat(a.best) - parseFloat(b.best)),
  };

  const circuit = obj(rRace.Circuit).circuitName ?? obj(qRace.Circuit).circuitName;
  return {
    status: results.length > 0 ? "ft" : "sched",
    round,
    name: str(rRace.raceName) ?? str(qRace.raceName),
    circuit: str(circuit),
    date: str(rRace.date) ?? str(qRace.date),
    results,
    fastestLap,
    qualifying,
    pitstops,
    syncedAt: new Date().toISOString(),
  };
}

async function fetchJSON(url: string, revalidate: number): Promise<Json | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" }, next: { revalidate, tags: ["f1-detail"] }, signal: ctrl.signal });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return (await res.json()) as Json;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchRaceDetail(round: number, revalidate = 600): Promise<RaceDetail | null> {
  const [results, qualifying, pitstops] = await Promise.all([
    fetchJSON(`${BASE}/${round}/results.json`, revalidate),
    fetchJSON(`${BASE}/${round}/qualifying.json`, revalidate),
    fetchJSON(`${BASE}/${round}/pitstops.json?limit=100`, revalidate),
  ]);
  if (!results && !qualifying) return null;
  return normalizeRace(round, {
    results: results ?? undefined,
    qualifying: qualifying ?? undefined,
    pitstops: pitstops ?? undefined,
  });
}
