import { NextResponse } from "next/server";
import { f1Adapter } from "@/lib/sports/f1";

export const dynamic = "force-dynamic";

export async function GET() {
  let data;
  try {
    data = await f1Adapter.getLive(true);
  } catch {
    data = f1Adapter.snapshot();
  }
  const sMaxAge = data.liveCount > 0 ? 15 : 60;
  return NextResponse.json(data, {
    headers: { "Cache-Control": `public, s-maxage=${sMaxAge}, stale-while-revalidate=120` },
  });
}
