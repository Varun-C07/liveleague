import { NextResponse } from "next/server";
import { liveOverview } from "@/lib/sports/overview";

export const dynamic = "force-dynamic";

// Aggregate "what's live across every sport" — one CDN-cached response that the
// home page polls, instead of fanning out to each sport from the browser.
export async function GET() {
  const data = await liveOverview();
  const sMaxAge = data.totalLive > 0 ? 15 : 60;
  return NextResponse.json(data, {
    headers: { "Cache-Control": `public, s-maxage=${sMaxAge}, stale-while-revalidate=120` },
  });
}
