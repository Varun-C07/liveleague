import type { SportAdapter, LiveBundle, Game, GameExtra } from "@liveleague/core/sports/types";
import { sportMeta } from "@liveleague/core/sports/meta";
import { fetchEspnScoreboard, mapEspnEvent, type EspnMapped } from "./espn";
import { NBA_SNAPSHOT } from "@/data/snapshots/nba";

const META = sportMeta("nba")!;

function nbaExtra({ status }: EspnMapped): GameExtra {
  const p = status?.period;
  const state = status?.type?.state;
  let period: string | null = null;
  if (state === "in" && p) period = p <= 4 ? `Q${p}` : `OT${p - 4}`;
  else if (state === "post") period = "Final";
  return { sport: "nba", period, clock: state === "in" ? status?.displayClock || null : null };
}

export const nbaAdapter: SportAdapter = {
  ...META,
  async getLive(live: boolean): Promise<LiveBundle> {
    const revalidate = live ? 15 : 60;
    try {
      const events = await fetchEspnScoreboard("basketball/nba", revalidate);
      // An empty-but-OK response means "no games today" — a live state, not an error.
      const games = events
        .map((ev) => mapEspnEvent(ev, "nba", nbaExtra))
        .filter((g): g is Game => g !== null);
      return {
        sport: "nba",
        source: "live",
        reason: games.length ? "live" : "empty",
        syncedAt: new Date().toISOString(),
        liveCount: games.filter((g) => g.status === "live").length,
        games,
      };
    } catch {
      return this.snapshot();
    }
  },
  snapshot(): LiveBundle {
    return {
      sport: "nba",
      source: "snapshot",
      reason: "fallback",
      syncedAt: new Date().toISOString(),
      liveCount: NBA_SNAPSHOT.filter((g) => g.status === "live").length,
      games: NBA_SNAPSHOT,
    };
  },
};
