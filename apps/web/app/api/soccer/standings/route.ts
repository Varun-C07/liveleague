import { NextResponse } from "next/server";
import { liveStandingsResponse } from "@/lib/snapshot";

export const dynamic = "force-dynamic";

export async function GET() {
  const body = await liveStandingsResponse();
  const sMaxAge = body.source === "live" ? 30 : 60;
  return NextResponse.json(body, {
    headers: { "Cache-Control": `public, s-maxage=${sMaxAge}, stale-while-revalidate=120` },
  });
}
