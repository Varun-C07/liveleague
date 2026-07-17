import { SPORTS } from "./registry";
import type { LiveBundle, LiveOverview, SportAdapter, SportSummary } from "@liveleagues/core/sports/types";
import { topGames } from "@liveleagues/core/sports/format";

function toSummary(s: SportAdapter, b: LiveBundle): SportSummary {
  // strip the adapter's functions, keep the static meta fields
  const { id, name, short, blurb, emoji, accent, accentVar, basePath, competitionLabel } = s;
  return {
    id,
    name,
    short,
    blurb,
    emoji,
    accent,
    accentVar,
    basePath,
    competitionLabel,
    source: b.source,
    reason: b.reason,
    syncedAt: b.syncedAt,
    liveCount: b.liveCount,
    total: b.games.length,
    // Carry ALL live games (plus a few upcoming) so the home "Live now" section and
    // ticker never truncate simultaneous live matches — not just a fixed top-3.
    topGames: topGames(b.games, Math.max(3, b.liveCount + 3)),
  };
}

// Fan out across all sports in parallel; each failure degrades to its snapshot.
export async function liveOverview(): Promise<LiveOverview> {
  const sports = await Promise.all(
    SPORTS.map(async (s) => {
      let b: LiveBundle;
      try {
        b = await s.getLive(true);
      } catch {
        b = s.snapshot();
      }
      return toSummary(s, b);
    }),
  );
  return {
    syncedAt: new Date().toISOString(),
    totalLive: sports.reduce((a, x) => a + x.liveCount, 0),
    sports,
  };
}

// Synchronous snapshot overview to seed SSR first paint (never blank).
export function snapshotOverview(): LiveOverview {
  const sports = SPORTS.map((s) => toSummary(s, s.snapshot()));
  return {
    syncedAt: new Date().toISOString(),
    totalLive: sports.reduce((a, x) => a + x.liveCount, 0),
    sports,
  };
}
