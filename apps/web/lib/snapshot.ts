import { freshSchedule } from "@/lib/schedule";
import { getMatches } from "@/lib/tsdb";
import { toApiMatch } from "@/lib/normalize";
import { computeGroups, bestThirds } from "@/lib/standings";
import { TEAMS } from "@/data/teams";
import type { Match } from "@liveleagues/core/types";
import type { MatchesResponse, StandingsResponse, StandingRowDto } from "@liveleagues/core/api-shape";

function toGroupDtos(matches: Match[]): Record<string, StandingRowDto[]> {
  const groupsRaw = computeGroups(matches);
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
  return groups;
}

// Cache-first live responses, shared by the API routes and the SSR pages so the
// first server-rendered paint is the latest *stored* data (not the static
// snapshot) and returns instantly.
export async function liveMatchesResponse(): Promise<MatchesResponse> {
  const data = await getMatches(true);
  return {
    source: data.source,
    syncedAt: data.syncedAt,
    liveCount: data.liveCount,
    total: data.matches.length,
    matches: data.matches.map(toApiMatch),
  };
}

export async function liveStandingsResponse(): Promise<StandingsResponse> {
  const data = await getMatches(true);
  const groupsRaw = computeGroups(data.matches);
  return {
    source: data.source,
    syncedAt: data.syncedAt,
    groups: toGroupDtos(data.matches),
    bestThirds: bestThirds(groupsRaw),
  };
}

// Synchronous, build-time snapshot from the verified schedule. Used as the
// ultimate fallback seed so the board is never blank before live sync.

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
