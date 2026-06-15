import { NextResponse } from "next/server";
import { getMatches } from "@/lib/tsdb";
import { toApiMatch } from "@/lib/normalize";
import type { MatchesResponse } from "@/lib/api-shape";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getMatches(true);
  const body: MatchesResponse = {
    source: data.source,
    syncedAt: data.syncedAt,
    liveCount: data.liveCount,
    total: data.matches.length,
    matches: data.matches.map(toApiMatch),
  };
  // Short shared-cache window so the Vercel CDN absorbs fast client polls;
  // tighter when matches may be live.
  const sMaxAge = data.liveCount > 0 ? 15 : 60;
  return NextResponse.json(body, {
    headers: {
      "Cache-Control": `public, s-maxage=${sMaxAge}, stale-while-revalidate=120`,
    },
  });
}
