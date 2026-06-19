import { NextResponse } from "next/server";
import { liveMatchesResponse } from "@/lib/snapshot";

export const dynamic = "force-dynamic";

export async function GET() {
  // Cache-first: serves the stored bundle instantly + refreshes in the background.
  const body = await liveMatchesResponse();
  const sMaxAge = body.liveCount > 0 ? 15 : 60;
  return NextResponse.json(body, {
    headers: {
      "Cache-Control": `public, s-maxage=${sMaxAge}, stale-while-revalidate=120`,
    },
  });
}
