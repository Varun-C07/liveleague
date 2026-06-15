import type { SportAdapter, LiveBundle, Game, Competitor } from "./types";
import { sportMeta } from "./meta";
import type { Match } from "@/lib/types";
import { getMatches } from "@/lib/tsdb";
import { freshSchedule } from "@/lib/schedule";
import { TEAMS } from "@/data/teams";

const META = sportMeta("soccer")!;

function comp(code: string, score: number | null): Competitor {
  const t = TEAMS[code];
  return {
    code,
    name: t ? t.name : code,
    logo: t ? t.flag : "",
    color: t ? t.color : "#5b6b60",
    score,
    real: !!t,
  };
}

function toGame(m: Match): Game {
  const minute = (m as Match & { minute?: string | null }).minute ?? null;
  const status = m.st === "ft" ? "final" : m.st;
  return {
    id: `soccer-${m.n}`,
    sport: "soccer",
    status,
    utc: m.utc,
    approx: m.approx,
    venue: m.ven,
    city: m.city,
    country: m.ctry,
    home: comp(m.h, m.hs),
    away: comp(m.a, m.as),
    label: m.stage,
    extra: { sport: "soccer", grp: m.grp, minute: status === "live" ? minute : null, stage: m.stage },
  };
}

export const soccerAdapter: SportAdapter = {
  ...META,
  async getLive(live: boolean): Promise<LiveBundle> {
    const data = await getMatches(live);
    return {
      sport: "soccer",
      source: data.source,
      syncedAt: data.syncedAt,
      liveCount: data.liveCount,
      games: data.matches.map(toGame),
    };
  },
  snapshot(): LiveBundle {
    const matches = freshSchedule();
    return {
      sport: "soccer",
      source: "snapshot",
      syncedAt: new Date().toISOString(),
      liveCount: matches.filter((m) => m.st === "live").length,
      games: matches.map(toGame),
    };
  },
};
