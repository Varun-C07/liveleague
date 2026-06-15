import type { SportAdapter, LiveBundle, Game, GameExtra } from "./types";
import { sportMeta } from "./meta";
import { fetchEspnScoreboard, mapEspnEvent, type EspnMapped } from "./espn";
import { MLB_SNAPSHOT } from "@/data/snapshots/baseball";

const META = sportMeta("baseball")!;

function half(detail?: string): "top" | "bot" | null {
  const d = (detail || "").toLowerCase();
  if (d.startsWith("top")) return "top";
  if (d.startsWith("bot") || d.startsWith("bottom")) return "bot";
  return null;
}

function baseballExtra({ status, competition }: EspnMapped): GameExtra {
  const state = status?.type?.state;
  if (state !== "in") return { sport: "baseball", inning: null, half: null, outs: null };
  const detail = status?.type?.shortDetail || status?.type?.detail;
  return {
    sport: "baseball",
    inning: status?.period ? String(status.period) : null,
    half: half(detail),
    outs: competition.situation?.outs ?? null,
  };
}

export const baseballAdapter: SportAdapter = {
  ...META,
  async getLive(live: boolean): Promise<LiveBundle> {
    const revalidate = live ? 15 : 60;
    try {
      const events = await fetchEspnScoreboard("baseball/mlb", revalidate);
      // An empty-but-OK response means "no games today" — a live state, not an error.
      const games = events
        .map((ev) => mapEspnEvent(ev, "baseball", baseballExtra))
        .filter((g): g is Game => g !== null);
      return {
        sport: "baseball",
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
      sport: "baseball",
      source: "snapshot",
      reason: "fallback",
      syncedAt: new Date().toISOString(),
      liveCount: MLB_SNAPSHOT.filter((g) => g.status === "live").length,
      games: MLB_SNAPSHOT,
    };
  },
};
