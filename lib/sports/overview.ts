import { SPORTS } from "./registry";
import type { LiveBundle, LiveOverview, SportAdapter, SportSummary } from "./types";
import { topGames } from "./format";

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
    syncedAt: b.syncedAt,
    liveCount: b.liveCount,
    total: b.games.length,
    topGames: topGames(b.games, 3),
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
