import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/db/supabase-admin";
import { readCache } from "@/lib/db/cache";
import { codeFromName } from "@/lib/normalize";
import { fetchEspnSoccer } from "@/lib/espn-soccer";
import { fetchMatchDetail, type MatchDetail } from "@/lib/espn-summary";
import type { Match } from "@liveleague/core/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CachedMatches = { matches: Match[]; liveCount: number };

function supabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
}

async function readStored(matchId: string): Promise<{ payload: MatchDetail; status: string } | null> {
  if (!supabaseConfigured()) return null;
  try {
    const { data } = await getAdminSupabase()
      .from("match_details")
      .select("payload, status")
      .eq("match_id", matchId)
      .maybeSingle();
    return data ? { payload: data.payload as MatchDetail, status: data.status as string } : null;
  } catch {
    return null;
  }
}

async function writeStored(matchId: string, espnId: string, detail: MatchDetail): Promise<void> {
  if (!supabaseConfigured()) return;
  try {
    await getAdminSupabase()
      .from("match_details")
      .upsert(
        { match_id: matchId, espn_event_id: espnId, status: detail.status, payload: detail, updated_at: new Date().toISOString() },
        { onConflict: "match_id" },
      );
  } catch {
    /* best-effort */
  }
}

// Find the match in the soccer cache + resolve its ESPN event id (falling back to
// ESPN's scoreboard for that date for matches played before this feature shipped).
async function resolveEspnId(match: Match): Promise<string | null> {
  if (match.espnId) return match.espnId;
  const date = match.utc.slice(0, 10);
  try {
    const events = await fetchEspnSoccer([date], 600);
    for (const ev of events) {
      const h = codeFromName(ev.strHomeTeam || "");
      const a = codeFromName(ev.strAwayTeam || "");
      if (ev.espnId && ((h === match.h && a === match.a) || (h === match.a && a === match.h))) {
        return ev.espnId;
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const n = Number(id.replace(/^soccer-/, ""));

  const cached = await readCache<CachedMatches>("soccer");
  const match = cached?.payload?.matches?.find((m) => m.n === n) ?? null;
  const stored = await readStored(id);

  // Finished + already stored → immutable, serve straight from the DB.
  if (stored && match?.st === "ft" && stored.status === "ft") {
    return NextResponse.json(stored.payload, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400" },
    });
  }

  if (!match) {
    return stored
      ? NextResponse.json(stored.payload)
      : NextResponse.json({ error: "unknown_match" }, { status: 404 });
  }

  const espnId = await resolveEspnId(match);
  if (!espnId) {
    // No detail source (e.g. lineups not published yet for a scheduled game).
    return stored
      ? NextResponse.json(stored.payload)
      : NextResponse.json({ error: "no_detail", status: match.st }, { status: 404 });
  }

  const live = match.st === "live";
  let detail: MatchDetail | null = null;
  try {
    detail = await fetchMatchDetail(espnId, live ? 15 : 600);
  } catch {
    detail = null;
  }
  if (!detail) {
    return stored
      ? NextResponse.json(stored.payload)
      : NextResponse.json({ error: "fetch_failed" }, { status: 502 });
  }

  await writeStored(id, espnId, detail);
  const sMaxAge = detail.status === "ft" ? 86400 : 15;
  return NextResponse.json(detail, {
    headers: { "Cache-Control": `public, s-maxage=${sMaxAge}, stale-while-revalidate=120` },
  });
}
