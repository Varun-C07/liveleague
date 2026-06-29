import { NextResponse } from "next/server";
import { baseballAdapter } from "@/lib/sports/baseball";

export const dynamic = "force-dynamic";

export async function GET() {
  let data;
  try {
    data = await baseballAdapter.getLive(true);
  } catch {
    data = baseballAdapter.snapshot();
  }
  const sMaxAge = data.liveCount > 0 ? 15 : 60;
  return NextResponse.json(data, {
    headers: { "Cache-Control": `public, s-maxage=${sMaxAge}, stale-while-revalidate=120` },
  });
}
