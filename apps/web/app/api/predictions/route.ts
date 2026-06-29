import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/db/supabase-server";
import { requireUser, requirePersonal, gateErrorResponse } from "@/lib/entitlements";
import { soccerAdapter } from "@/lib/sports/soccer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET own predictions (any signed-in user). POST a prediction (requires the
// Personal subscription) — locked at kickoff, scored after full time.

export async function GET() {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    const { data } = await supabase
      .from("predictions")
      .select(
        "match_id, pred_home, pred_away, kickoff_utc, locked, actual_home, actual_away, points, outcome",
      )
      .order("kickoff_utc", { ascending: true });
    return NextResponse.json({ predictions: data ?? [] });
  } catch (e) {
    const r = gateErrorResponse(e);
    if (r) return r;
    throw e;
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await requirePersonal();
    const body = (await req.json().catch(() => ({}))) as {
      matchId?: string;
      predHome?: number;
      predAway?: number;
    };
    const matchId = body.matchId;
    const predHome = Number(body.predHome);
    const predAway = Number(body.predAway);
    if (
      !matchId ||
      !Number.isInteger(predHome) ||
      !Number.isInteger(predAway) ||
      predHome < 0 ||
      predAway < 0 ||
      predHome > 99 ||
      predAway > 99
    ) {
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }

    // Resolve the match server-side: get kickoff + ensure it hasn't started.
    let bundle;
    try {
      bundle = await soccerAdapter.getLive(true);
    } catch {
      bundle = soccerAdapter.snapshot();
    }
    const game = bundle.games.find((g) => g.id === matchId);
    if (!game) {
      return NextResponse.json({ error: "unknown_match" }, { status: 404 });
    }
    if (game.status !== "sched" || new Date(game.utc).getTime() <= Date.now()) {
      return NextResponse.json({ error: "locked" }, { status: 409 });
    }

    const supabase = await getServerSupabase();
    const { error } = await supabase.from("predictions").upsert(
      {
        user_id: user.id,
        match_id: matchId,
        tournament: "wc2026",
        pred_home: predHome,
        pred_away: predAway,
        kickoff_utc: game.utc,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,match_id" },
    );
    if (error) {
      // guard trigger raises prediction_locked if the row is already locked
      if (error.message?.includes("locked")) {
        return NextResponse.json({ error: "locked" }, { status: 409 });
      }
      return NextResponse.json({ error: "save_failed" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const r = gateErrorResponse(e);
    if (r) return r;
    throw e;
  }
}
