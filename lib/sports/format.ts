import type { Game, SportId } from "./types";
import { SPORT_META } from "./meta";

const ACCENT: Record<string, string> = Object.fromEntries(SPORT_META.map((s) => [s.id, s.accent]));

export function accentFor(sport: SportId): string {
  return ACCENT[sport] || "var(--accent)";
}

// F1 "games" are races (no two competitors) — everything else is home vs away.
export function isVersus(g: Game): boolean {
  return g.sport !== "f1";
}

// Short label shown while a game is live, derived from the sport-specific extra.
export function liveLabel(g: Game): string {
  switch (g.extra.sport) {
    case "soccer":
      return g.extra.minute || "LIVE";
    case "nba":
      return [g.extra.period, g.extra.clock].filter(Boolean).join(" ") || "LIVE";
    case "baseball": {
      const arrow = g.extra.half === "top" ? "▲" : g.extra.half === "bot" ? "▼" : "";
      return g.extra.inning ? `${arrow}${g.extra.inning}` : "LIVE";
    }
    case "cricket":
      return g.extra.overs ? `${g.extra.overs} ov` : "LIVE";
    case "f1":
      return "LIVE";
  }
}

// Compact score string, e.g. "2–1". Returns "v" when no score should show yet.
export function scoreText(g: Game): string {
  if (g.status === "sched") return "v";
  return `${g.home.score ?? 0}–${g.away.score ?? 0}`;
}

// Pick the most relevant games for a ticker / summary card: live first, then the
// soonest upcoming, then most-recent finals as a fallback. Limit `n`.
export function topGames(games: Game[], n: number): Game[] {
  const live = games.filter((g) => g.status === "live");
  const upcoming = games
    .filter((g) => g.status === "sched")
    .sort((a, b) => +new Date(a.utc) - +new Date(b.utc));
  const finals = games
    .filter((g) => g.status === "final")
    .sort((a, b) => +new Date(b.utc) - +new Date(a.utc));
  return [...live, ...upcoming, ...finals].slice(0, n);
}
