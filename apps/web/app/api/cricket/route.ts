import { NextResponse } from "next/server";
import { cricketAdapter } from "@/lib/sports/cricket";

export const dynamic = "force-dynamic";

export async function GET() {
  let data;
  try {
    data = await cricketAdapter.getLive(true);
  } catch {
    data = cricketAdapter.snapshot();
  }
  const sMaxAge = data.liveCount > 0 ? 15 : 60;
  return NextResponse.json(data, {
    headers: { "Cache-Control": `public, s-maxage=${sMaxAge}, stale-while-revalidate=120` },
  });
}
