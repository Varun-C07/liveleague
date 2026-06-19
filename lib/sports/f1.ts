import { after } from "next/server";
import type { SportAdapter, LiveBundle, Game, GameStatus, StandingRow } from "./types";
import { sportMeta } from "./meta";
import { F1_SCHEDULE, colorForConstructor, type F1Driver, type F1Round } from "@/data/snapshots/f1";
import { readCache, writeCache } from "@/lib/db/cache";

function scheduleRefresh(fn: () => Promise<unknown>) {
  try {
    after(fn);
  } catch {
    /* not in a request scope (e.g. cron) */
  }
}

const META = sportMeta("f1")!;
const BASE = process.env.JOLPICA_BASE || "https://api.jolpi.ca/ergast/f1/2026";
const RACE_WINDOW_MS = 3 * 60 * 60_000; // treat the ~3h around start as "live"

// ---- Jolpica (Ergast-compatible) response shapes we read ----
type JDriver = { code?: string; givenName?: string; familyName?: string };
type JResult = { Driver?: JDriver; Constructor?: { constructorId?: string } };
type JRace = { round?: string; Results?: JResult[] };
type JStanding = {
  position?: string;
  points?: string;
  wins?: string;
  Driver?: JDriver;
  Constructors?: { constructorId?: string }[];
};
type JConstructorStanding = {
  position?: string;
  points?: string;
  wins?: string;
  Constructor?: { constructorId?: string; name?: string };
};

function driverCode(dr?: JDriver): string {
  return dr?.code || (dr?.familyName ? dr.familyName.slice(0, 3).toUpperCase() : "—");
}

function driverName(dr?: JDriver): string {
  const full = [dr?.givenName, dr?.familyName].filter(Boolean).join(" ");
  return full || driverCode(dr);
}

async function fetchJSON(url: string, revalidate: number): Promise<Record<string, unknown>> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 7000); // bound a slow upstream
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" }, next: { revalidate, tags: ["f1"] }, signal: ctrl.signal });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return (await res.json()) as Record<string, unknown>;
  } finally {
    clearTimeout(timer);
  }
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
    name: driverName(dr.Driver),
    color: colorForConstructor(dr.Constructors?.[dr.Constructors.length - 1]?.constructorId),
    metrics: [
      { label: "PTS", value: dr.points ?? "0" },
      { label: "W", value: +(dr.wins || 0) },
    ],
  }));
}

// Constructors' championship (Jolpica constructorStandings). Same StandingRow
// shape so the design reuses its table; `code` is a short tag, `name` the team.
function ctorCode(name: string | undefined, id: string | undefined): string {
  const src = (name || id || "").replace(/[^A-Za-z]/g, "");
  return src ? src.slice(0, 3).toUpperCase() : "—";
}

async function fetchConstructorStandings(revalidate: number): Promise<StandingRow[] | null> {
  const j = await fetchJSON(`${BASE}/constructorStandings.json`, revalidate);
  const lists =
    (((j.MRData as Record<string, unknown>)?.StandingsTable as Record<string, unknown>)?.StandingsLists as Record<
      string,
      unknown
    >[]) || [];
  const cs = (lists[0]?.ConstructorStandings as JConstructorStanding[]) || null;
  if (!cs || !cs.length) return null;
  return cs.map((c) => ({
    rank: +(c.position || 0),
    code: ctorCode(c.Constructor?.name, c.Constructor?.constructorId),
    name: c.Constructor?.name ?? "—",
    color: colorForConstructor(c.Constructor?.constructorId),
    metrics: [
      { label: "PTS", value: c.points ?? "0" },
      { label: "W", value: +(c.wins || 0) },
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

// Last real bundle from the write-through cache (games/standings are real, just
// not a fresh live fetch). Null if nothing cached yet.
async function cachedBundle(): Promise<LiveBundle | null> {
  const cached = await readCache<LiveBundle>("f1");
  if (!cached?.payload?.games?.length) return null;
  return { ...cached.payload, syncedAt: cached.syncedAt };
}

// Fetch Jolpica → build the bundle → write-through. Falls back to the last cache
// (or the static snapshot) if the season feed isn't reachable.
async function refreshF1(live: boolean): Promise<LiveBundle> {
  const revalidate = live ? 60 : 300;
  try {
    const [p1, p2, p3, standings, constructorStandings] = await Promise.all([
      fetchPos(1, revalidate),
      fetchPos(2, revalidate),
      fetchPos(3, revalidate),
      fetchStandings(revalidate).catch(() => null),
      fetchConstructorStandings(revalidate).catch(() => null),
    ]);
    const merged: Record<number, [F1Driver, F1Driver, F1Driver]> = {};
    for (const rd of Object.keys(p1)) {
      const n = +rd;
      if (p2[n] && p3[n]) merged[n] = [p1[n], p2[n], p3[n]];
    }
    const haveLive = Object.keys(merged).length > 0 || !!standings;
    const { games, liveCount } = buildGames(merged);
    const bundle: LiveBundle = {
      sport: "f1",
      source: "live",
      reason: "live",
      syncedAt: new Date().toISOString(),
      liveCount,
      games,
      standings: standings ?? undefined,
      standingsTitle: "Drivers' Championship",
      constructorStandings: constructorStandings ?? undefined,
      constructorTitle: "Constructors' Championship",
    };
    if (haveLive) {
      await writeCache("f1", bundle);
      return bundle;
    }
    return (await cachedBundle()) ?? f1Snapshot();
  } catch {
    return (await cachedBundle()) ?? f1Snapshot();
  }
}

export const f1Adapter: SportAdapter = {
  ...META,
  // Cache-first: serve the stored bundle instantly, refresh in the background.
  async getLive(live: boolean): Promise<LiveBundle> {
    const cached = await cachedBundle();
    if (cached) {
      scheduleRefresh(() => refreshF1(live));
      return cached;
    }
    return refreshF1(live);
  },
  snapshot(): LiveBundle {
    return f1Snapshot();
  },
};

function f1Snapshot(): LiveBundle {
  const { games, liveCount } = buildGames({});
  return {
    sport: "f1",
    source: "snapshot",
    reason: "fallback",
    syncedAt: new Date().toISOString(),
    liveCount,
    games,
  };
}
