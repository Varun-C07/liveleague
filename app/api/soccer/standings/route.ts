import { NextResponse } from "next/server";
import { getMatches } from "@/lib/tsdb";
import { computeGroups, bestThirds } from "@/lib/standings";
import { TEAMS } from "@/data/teams";
import type { StandingsResponse, StandingRowDto } from "@/lib/api-shape";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getMatches(true);
  const groupsRaw = computeGroups(data.matches);

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

  const body: StandingsResponse = {
    source: data.source,
    syncedAt: data.syncedAt,
    groups,
    bestThirds: bestThirds(groupsRaw),
  };
  const sMaxAge = data.liveCount > 0 ? 15 : 60;
  return NextResponse.json(body, {
    headers: { "Cache-Control": `public, s-maxage=${sMaxAge}, stale-while-revalidate=120` },
  });
}
