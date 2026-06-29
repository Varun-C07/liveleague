import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/db/supabase-server";
import {
  requireUser,
  requirePersonal,
  gateErrorResponse,
} from "@/lib/entitlements";
import { genJoinCode } from "@/lib/joincode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MembershipRow = {
  points: number;
  league: {
    id: string;
    name: string;
    join_code: string;
    owner_id: string;
  } | null;
};

// GET my leagues (any signed-in user). POST creates a league (Personal only).
export async function GET() {
  try {
    const user = await requireUser();
    const supabase = await getServerSupabase();
    const { data } = await supabase
      .from("league_members")
      .select("points, league:league_id(id, name, join_code, owner_id)")
      .eq("user_id", user.id);
    const leagues = ((data ?? []) as unknown as MembershipRow[])
      .filter((m) => m.league)
      .map((m) => ({
        id: m.league!.id,
        name: m.league!.name,
        joinCode: m.league!.join_code,
        isOwner: m.league!.owner_id === user.id,
        myPoints: m.points,
      }));
    return NextResponse.json({ leagues });
  } catch (e) {
    const r = gateErrorResponse(e);
    if (r) return r;
    throw e;
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await requirePersonal();
    const body = (await req.json().catch(() => ({}))) as { name?: string };
    const name = (body.name ?? "").trim();
    if (name.length < 1 || name.length > 60) {
      return NextResponse.json({ error: "bad_name" }, { status: 400 });
    }
    const supabase = await getServerSupabase();

    // Insert with a unique join code, retrying on the rare collision.
    let created: { id: string; name: string; join_code: string } | null = null;
    for (let attempt = 0; attempt < 6; attempt++) {
      const { data, error } = await supabase
        .from("leagues")
        .insert({ name, join_code: genJoinCode(), owner_id: user.id })
        .select("id, name, join_code")
        .single();
      if (!error && data) {
        created = data;
        break;
      }
      if (error && error.code !== "23505") {
        return NextResponse.json({ error: "create_failed" }, { status: 500 });
      }
    }
    if (!created) {
      return NextResponse.json({ error: "code_collision" }, { status: 500 });
    }

    await supabase
      .from("league_members")
      .insert({ league_id: created.id, user_id: user.id });

    return NextResponse.json({
      league: {
        id: created.id,
        name: created.name,
        joinCode: created.join_code,
        isOwner: true,
        myPoints: 0,
      },
    });
  } catch (e) {
    const r = gateErrorResponse(e);
    if (r) return r;
    throw e;
  }
}
