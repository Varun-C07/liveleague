import { freshSchedule } from "@/lib/schedule";
import { toApiMatch } from "@/lib/normalize";
import { computeGroups, bestThirds } from "@/lib/standings";
import { TEAMS } from "@/data/teams";
import type { MatchesResponse, StandingsResponse, StandingRowDto } from "@/lib/api-shape";

// Synchronous, build-time snapshot from the verified schedule. Used to seed
// React Query (SSR first paint) so the board is never blank before live sync.

export function snapshotMatches(): MatchesResponse {
  const matches = freshSchedule();
  return {
    source: "snapshot",
    syncedAt: new Date().toISOString(),
    liveCount: matches.filter((m) => m.st === "live").length,
    total: matches.length,
    matches: matches.map(toApiMatch),
  };
}

export function snapshotStandings(): StandingsResponse {
  const groupsRaw = computeGroups(freshSchedule());
  const groups: Record<string, StandingRowDto[]> = {};
  for (const g of Object.keys(groupsRaw)) {
    groups[g] = groupsRaw[g].map((r) => {
      const t = TEAMS[r.c];
      return {
        code: r.c,
        name: t ? t.name : r.c,
        flag: t ? t.flag : "",
        color: t ? t.color : "#5b6b60",
        P: r.P, W: r.W, D: r.D, L: r.L, GF: r.GF, GA: r.GA, GD: r.GD, Pts: r.Pts,
      };
    });
  }
  return {
    source: "snapshot",
    syncedAt: new Date().toISOString(),
    groups,
    bestThirds: bestThirds(groupsRaw),
  };
}
