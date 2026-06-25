import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/db/supabase-admin";
import { fetchRaceDetail, type RaceDetail } from "@/lib/jolpica-race";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function supabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
}

async function readStored(matchId: string): Promise<{ payload: RaceDetail; status: string } | null> {
  if (!supabaseConfigured()) return null;
  try {
    const { data } = await getAdminSupabase()
      .from("match_details")
      .select("payload, status")
      .eq("match_id", matchId)
      .maybeSingle();
    return data ? { payload: data.payload as RaceDetail, status: data.status as string } : null;
  } catch {
    return null;
  }
}

async function writeStored(matchId: string, detail: RaceDetail): Promise<void> {
  if (!supabaseConfigured()) return;
  try {
    await getAdminSupabase()
      .from("match_details")
      .upsert(
        { match_id: matchId, espn_event_id: null, status: detail.status, payload: detail, updated_at: new Date().toISOString() },
        { onConflict: "match_id" },
      );
  } catch {
    /* best-effort */
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // "f1-7"
  const round = Number(id.replace(/^f1-/, ""));
  if (!round) return NextResponse.json({ error: "bad_round" }, { status: 400 });

  const stored = await readStored(id);
  // Finished race detail is immutable → serve from the DB.
  if (stored && stored.status === "ft") {
    return NextResponse.json(stored.payload, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400" },
    });
  }

  let detail: RaceDetail | null = null;
  try {
    detail = await fetchRaceDetail(round, 600);
  } catch {
    detail = null;
  }
  if (!detail || (detail.results.length === 0 && detail.qualifying.length === 0)) {
    return stored
      ? NextResponse.json(stored.payload)
      : NextResponse.json({ error: "no_detail" }, { status: 404 });
  }

  await writeStored(id, detail);
  const sMaxAge = detail.status === "ft" ? 86400 : 300;
  return NextResponse.json(detail, {
    headers: { "Cache-Control": `public, s-maxage=${sMaxAge}, stale-while-revalidate=300` },
  });
}
