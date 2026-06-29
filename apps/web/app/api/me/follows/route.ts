import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/db/supabase-server";
import { requireUser, gateErrorResponse } from "@/lib/entitlements";
import { favKey } from "@liveleague/core/favorites";
import type { SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// DB-backed followed teams for the signed-in user. Login required (not payment);
// the 4-per-sport cap is enforced by a DB trigger. Keys mirror the client's
// favKey("sport","code") scheme so the favorites UI is unchanged.

export async function GET() {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    return keysResponse(supabase);
  } catch (e) {
    const r = gateErrorResponse(e);
    if (r) return r;
    throw e;
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = (await req.json().catch(() => ({}))) as {
      sport?: string;
      code?: string;
    };
    if (!body.sport || !body.code) {
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }
    const supabase = await getServerSupabase();
    const { error } = await supabase
      .from("followed_teams")
      .insert({ user_id: user.id, sport: body.sport, team_code: body.code });
    if (error && !isDuplicate(error)) {
      if (error.message?.includes("follow_cap")) {
        return NextResponse.json({ error: "follow_cap_reached" }, { status: 409 });
      }
      return NextResponse.json({ error: "insert_failed" }, { status: 500 });
    }
    return keysResponse(supabase);
  } catch (e) {
    const r = gateErrorResponse(e);
    if (r) return r;
    throw e;
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const sport = searchParams.get("sport");
    const code = searchParams.get("code");
    if (!sport || !code) {
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }
    const supabase = await getServerSupabase();
    await supabase
      .from("followed_teams")
      .delete()
      .eq("user_id", user.id)
      .eq("sport", sport)
      .eq("team_code", code);
    return keysResponse(supabase);
  } catch (e) {
    const r = gateErrorResponse(e);
    if (r) return r;
    throw e;
  }
}

function isDuplicate(error: { code?: string }): boolean {
  return error.code === "23505"; // unique_violation — already following, treat as ok
}

async function keysResponse(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("followed_teams")
    .select("sport, team_code");
  const keys = (data ?? []).map(
    (r: { sport: string; team_code: string }) => favKey(r.sport, r.team_code),
  );
  return NextResponse.json({ keys });
}
