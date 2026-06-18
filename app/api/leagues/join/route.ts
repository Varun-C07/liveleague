import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/db/supabase-admin";
import { requireUser, gateErrorResponse } from "@/lib/entitlements";
import { normalizeJoinCode, isValidJoinCode } from "@/lib/joincode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Join a league by code. Free for any signed-in user (the conversion funnel).
// Uses the admin client because a non-member can't read the league via RLS yet.
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = (await req.json().catch(() => ({}))) as { joinCode?: string };
    const code = normalizeJoinCode(body.joinCode ?? "");
    if (!isValidJoinCode(code)) {
      return NextResponse.json({ error: "bad_code" }, { status: 400 });
    }
    const admin = getAdminSupabase();
    const { data: league } = await admin
      .from("leagues")
      .select("id, name")
      .eq("join_code", code)
      .maybeSingle();
    if (!league) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    // Idempotent: re-joining doesn't reset joined_at (matters for per-league scoring).
    await admin
      .from("league_members")
      .upsert(
        { league_id: league.id, user_id: user.id },
        { onConflict: "league_id,user_id", ignoreDuplicates: true },
      );
    return NextResponse.json({ league: { id: league.id, name: league.name } });
  } catch (e) {
    const r = gateErrorResponse(e);
    if (r) return r;
    throw e;
  }
}
