import { NextResponse } from "next/server";
import { nbaAdapter } from "@/lib/sports/nba";

export const dynamic = "force-dynamic";

export async function GET() {
  let data;
  try {
    data = await nbaAdapter.getLive(true);
  } catch {
    data = nbaAdapter.snapshot();
  }
  const sMaxAge = data.liveCount > 0 ? 15 : 60;
  return NextResponse.json(data, {
    headers: { "Cache-Control": `public, s-maxage=${sMaxAge}, stale-while-revalidate=120` },
  });
}
