import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/db/supabase-server";
import { requireUser, gateErrorResponse } from "@/lib/entitlements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BoardRow = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  points: number;
  rank: number;
};

// GET league + leaderboard (members only). DELETE = owner deletes league, or a
// non-owner leaves it.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const supabase = await getServerSupabase();

    const { data: league } = await supabase
      .from("leagues")
      .select("id, name, join_code, owner_id")
      .eq("id", id)
      .maybeSingle();
    if (!league) {
      return NextResponse.json(
        { error: "not_found_or_not_member" },
        { status: 404 },
      );
    }

    const { data: board } = await supabase.rpc("league_leaderboard", {
      p_league_id: id,
    });
    const leaderboard = ((board ?? []) as BoardRow[]).map((r) => ({
      userId: r.user_id,
      name: r.display_name,
      avatarUrl: r.avatar_url,
      points: r.points,
      rank: r.rank,
      isMe: r.user_id === user.id,
    }));

    return NextResponse.json({
      league: {
        id: league.id,
        name: league.name,
        joinCode: league.join_code,
        isOwner: league.owner_id === user.id,
      },
      leaderboard,
    });
  } catch (e) {
    const r = gateErrorResponse(e);
    if (r) return r;
    throw e;
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const supabase = await getServerSupabase();
    const { data: league } = await supabase
      .from("leagues")
      .select("owner_id")
      .eq("id", id)
      .maybeSingle();
    if (!league) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (league.owner_id === user.id) {
      await supabase.from("leagues").delete().eq("id", id);
      return NextResponse.json({ deleted: true });
    }
    await supabase
      .from("league_members")
      .delete()
      .eq("league_id", id)
      .eq("user_id", user.id);
    return NextResponse.json({ left: true });
  } catch (e) {
    const r = gateErrorResponse(e);
    if (r) return r;
    throw e;
  }
}
