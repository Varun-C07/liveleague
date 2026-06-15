import type { SportAdapter, LiveBundle, Game, GameStatus, StandingRow } from "./types";
import { sportMeta } from "./meta";
import { F1_SCHEDULE, colorForConstructor, type F1Driver, type F1Round } from "@/data/snapshots/f1";

const META = sportMeta("f1")!;
const BASE = process.env.JOLPICA_BASE || "https://api.jolpi.ca/ergast/f1/2026";
const RACE_WINDOW_MS = 3 * 60 * 60_000; // treat the ~3h around start as "live"

// ---- Jolpica (Ergast-compatible) response shapes we read ----
type JResult = { Driver?: { code?: string; familyName?: string }; Constructor?: { constructorId?: string } };
type JRace = { round?: string; Results?: JResult[] };
type JStanding = {
  position?: string;
  points?: string;
  wins?: string;
  Driver?: { code?: string; familyName?: string };
  Constructors?: { constructorId?: string }[];
};

function driverCode(dr?: { code?: string; familyName?: string }): string {
  return dr?.code || (dr?.familyName ? dr.familyName.slice(0, 3).toUpperCase() : "—");
}

async function fetchJSON(url: string, revalidate: number): Promise<Record<string, unknown>> {
  const res = await fetch(url, { headers: { Accept: "application/json" }, next: { revalidate, tags: ["f1"] } });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return (await res.json()) as Record<string, unknown>;
}

// One finishing position across all rounds: round -> driver.
async function fetchPos(p: number, revalidate: number): Promise<Record<number, F1Driver>> {
  const j = await fetchJSON(`${BASE}/results/${p}.json?limit=100`, revalidate);
  const races = (((j.MRData as Record<string, unknown>)?.RaceTable as Record<string, unknown>)?.Races as JRace[]) || [];
  const out: Record<number, F1Driver> = {};
  for (const rc of races) {
    const r0 = rc.Results?.[0];
    if (!r0 || !rc.round) continue;
    out[+rc.round] = { code: driverCode(r0.Driver), color: colorForConstructor(r0.Constructor?.constructorId) };
  }
  return out;
}

async function fetchStandings(revalidate: number): Promise<StandingRow[] | null> {
  const j = await fetchJSON(`${BASE}/driverStandings.json`, revalidate);
  const lists =
    (((j.MRData as Record<string, unknown>)?.StandingsTable as Record<string, unknown>)?.StandingsLists as Record<
      string,
      unknown
    >[]) || [];
  const ds = (lists[0]?.DriverStandings as JStanding[]) || null;
  if (!ds || !ds.length) return null;
  return ds.map((dr) => ({
    rank: +(dr.position || 0),
    code: driverCode(dr.Driver),
    name: driverCode(dr.Driver),
    color: colorForConstructor(dr.Constructors?.[dr.Constructors.length - 1]?.constructorId),
    metrics: [
      { label: "PTS", value: dr.points ?? "0" },
      { label: "W", value: +(dr.wins || 0) },
    ],
  }));
}

function toGame(r: F1Round, podium: [F1Driver, F1Driver, F1Driver] | null, status: GameStatus): Game {
  return {
    id: `f1-${r.n}`,
    sport: "f1",
    status,
    utc: r.utc,
    approx: false,
    venue: r.circuit,
    city: r.loc,
    country: r.ctry,
    home: { code: `R${r.n}`, name: r.gp, color: META.accent, score: null, real: true },
    away: { code: "", name: "", color: META.accent, score: null, real: false },
    label: `Round ${r.n}${r.sprint ? " · Sprint" : ""}`,
    extra: { sport: "f1", round: r.n, circuit: r.circuit, sprint: r.sprint, podium },
  };
}

function buildGames(live: Record<number, [F1Driver, F1Driver, F1Driver]>) {
  const now = Date.now();
  let liveCount = 0;
  const games = F1_SCHEDULE.map((r) => {
    const podium = live[r.n] || r.podium;
    const start = new Date(r.utc).getTime();
    let status: GameStatus;
    if (podium) status = "final";
    else if (now >= start && now <= start + RACE_WINDOW_MS) {
      status = "live";
      liveCount++;
    } else status = "sched";
    return toGame(r, podium, status);
  });
  return { games, liveCount };
}

export const f1Adapter: SportAdapter = {
  ...META,
  async getLive(live: boolean): Promise<LiveBundle> {
    const revalidate = live ? 60 : 300;
    try {
      const [p1, p2, p3, standings] = await Promise.all([
        fetchPos(1, revalidate),
        fetchPos(2, revalidate),
        fetchPos(3, revalidate),
        fetchStandings(revalidate).catch(() => null),
      ]);
      const merged: Record<number, [F1Driver, F1Driver, F1Driver]> = {};
      for (const rd of Object.keys(p1)) {
        const n = +rd;
        if (p2[n] && p3[n]) merged[n] = [p1[n], p2[n], p3[n]];
      }
      const haveLive = Object.keys(merged).length > 0 || !!standings;
      const { games, liveCount } = buildGames(merged);
      return {
        sport: "f1",
        source: haveLive ? "live" : "snapshot",
        syncedAt: new Date().toISOString(),
        liveCount,
        games,
        standings: standings ?? undefined,
        standingsTitle: "Drivers' Championship",
      };
    } catch {
      return this.snapshot();
    }
  },
  snapshot(): LiveBundle {
    const { games, liveCount } = buildGames({});
    return {
      sport: "f1",
      source: "snapshot",
      syncedAt: new Date().toISOString(),
      liveCount,
      games,
    };
  },
};
