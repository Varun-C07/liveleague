import { F1_SCHEDULE, colorForConstructor } from "@/data/snapshots/f1";
import { canReach, gap, maxPointsRemaining } from "@liveleagues/core/sports/f1-scenarios";

const BASE = process.env.JOLPICA_BASE || "https://api.jolpi.ca/ergast/f1/2026";

export type DriverResult = { round: number; gp: string; sprint: boolean; position: number | null };

export type DriverProfile = {
  code: string;
  name: string;
  constructor: string;
  color: string;
  rank: number;
  points: number;
  wins: number;
  roundsCompleted: number;
  racesLeft: number;
  sprintsLeft: number;
  maxRemaining: number;
  leaderCode: string;
  gapToLeader: number;
  ahead: { code: string; gap: number; canCatch: boolean } | null;
  canWinTitle: boolean;
  results: DriverResult[];
};

type JDriver = { driverId?: string; code?: string; givenName?: string; familyName?: string };
type JConstructor = { constructorId?: string; name?: string };
type JStanding = {
  position?: string;
  points?: string;
  wins?: string;
  Driver?: JDriver;
  Constructors?: JConstructor[];
};

function fam(d?: JDriver): string {
  return d?.code || (d?.familyName ? d.familyName.slice(0, 3).toUpperCase() : "—");
}

async function fetchJSON(url: string): Promise<Record<string, unknown>> {
  const res = await fetch(url, { headers: { Accept: "application/json" }, next: { revalidate: 60, tags: ["f1"] } });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return (await res.json()) as Record<string, unknown>;
}

function dig(obj: unknown, ...path: string[]): unknown {
  let cur: unknown = obj;
  for (const k of path) cur = (cur as Record<string, unknown> | undefined)?.[k];
  return cur;
}

export async function driverProfile(codeRaw: string): Promise<DriverProfile | null> {
  const code = codeRaw.toUpperCase();
  try {
    const [dj, sj] = await Promise.all([
      fetchJSON(`${BASE}/drivers.json?limit=100`),
      fetchJSON(`${BASE}/driverStandings.json`),
    ]);

    const drivers = (dig(dj, "MRData", "DriverTable", "Drivers") as JDriver[]) || [];
    const dmeta = drivers.find((d) => (d.code || "").toUpperCase() === code);
    if (!dmeta?.driverId) return null;
    const driverId = dmeta.driverId;
    const name = [dmeta.givenName, dmeta.familyName].filter(Boolean).join(" ") || code;

    const list = (dig(sj, "MRData", "StandingsTable", "StandingsLists") as Record<string, unknown>[])?.[0];
    const standings = (list?.DriverStandings as JStanding[]) || [];
    const round = Number(list?.round) || 0;
    const me = standings.find((s) => s.Driver?.driverId === driverId);
    if (!me) return null;

    const rank = Number(me.position) || standings.length;
    const points = Number(me.points) || 0;
    const wins = Number(me.wins) || 0;
    const lastC = me.Constructors?.[me.Constructors.length - 1];
    const constructor = lastC?.name || "";
    const color = colorForConstructor(lastC?.constructorId);

    const leader = standings[0];
    const leaderPoints = Number(leader?.points) || points;
    const leaderCode = fam(leader?.Driver);

    const racesLeft = Math.max(0, F1_SCHEDULE.length - round);
    const sprintsLeft = F1_SCHEDULE.filter((r) => r.sprint && r.n > round).length;
    const maxRemaining = maxPointsRemaining(racesLeft, sprintsLeft);

    const aheadStanding = rank > 1 ? standings[rank - 2] : null;
    const ahead = aheadStanding
      ? {
          code: fam(aheadStanding.Driver),
          gap: gap(points, Number(aheadStanding.points) || 0),
          canCatch: canReach(points, Number(aheadStanding.points) || 0, maxRemaining),
        }
      : null;

    // season finishing positions
    const rj = await fetchJSON(`${BASE}/drivers/${driverId}/results.json?limit=100`).catch(() => null);
    const races = (dig(rj, "MRData", "RaceTable", "Races") as { round?: string; Results?: { position?: string }[] }[]) || [];
    const posByRound: Record<number, number | null> = {};
    for (const rc of races) {
      if (!rc.round) continue;
      const p = rc.Results?.[0]?.position;
      posByRound[Number(rc.round)] = p ? Number(p) : null;
    }
    const results: DriverResult[] = F1_SCHEDULE.filter((r) => r.n <= round).map((r) => ({
      round: r.n,
      gp: r.gp,
      sprint: r.sprint,
      position: posByRound[r.n] ?? null,
    }));

    return {
      code,
      name,
      constructor,
      color,
      rank,
      points,
      wins,
      roundsCompleted: round,
      racesLeft,
      sprintsLeft,
      maxRemaining,
      leaderCode,
      gapToLeader: gap(points, leaderPoints),
      ahead,
      canWinTitle: rank === 1 || canReach(points, leaderPoints, maxRemaining),
      results,
    };
  } catch {
    return null;
  }
}
