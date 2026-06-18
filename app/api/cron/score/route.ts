import { getAdminSupabase } from "@/lib/db/supabase-admin";
import { soccerAdapter } from "@/lib/sports/soccer";
import { computeScoringBatch } from "@/lib/scoring";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Scores locked predictions for finished matches. Scheduled every ~5 min by
// Supabase pg_cron. Idempotent: only unscored rows are processed, and user
// totals are recomputed by SUM (not incremented).
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  return !!secret && req.headers.get("authorization") === `Bearer ${secret}`;
}

async function run(req: Request) {
  if (!authorized(req)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const admin = getAdminSupabase();

  // 1. Finished soccer matches with both scores (clampLive already applied by the adapter).
  let bundle;
  try {
    bundle = await soccerAdapter.getLive(true);
  } catch {
    bundle = soccerAdapter.snapshot();
  }
  const finished = bundle.games
    .filter(
      (g) => g.status === "final" && g.home.score != null && g.away.score != null,
    )
    .map((g) => ({
      matchId: g.id,
      home: g.home.score as number,
      away: g.away.score as number,
    }));
  if (finished.length === 0) {
    return Response.json({ scored: 0, reason: "no_finished_matches" });
  }

  // 2. Unscored, locked predictions for those matches.
  const matchIds = finished.map((f) => f.matchId);
  const { data: preds } = await admin
    .from("predictions")
    .select("id, user_id, match_id, pred_home, pred_away")
    .is("scored_at", null)
    .eq("locked", true)
    .in("match_id", matchIds);
  if (!preds || preds.length === 0) {
    return Response.json({ scored: 0, reason: "no_pending_predictions" });
  }

  // 3. Score (pure).
  const batch = computeScoringBatch(
    finished,
    preds.map((p) => ({
      id: p.id,
      matchId: p.match_id,
      predHome: p.pred_home,
      predAway: p.pred_away,
    })),
  );
  const now = new Date().toISOString();

  // 4. Persist each score.
  for (const s of batch) {
    await admin
      .from("predictions")
      .update({
        points: s.points,
        outcome: s.outcome,
        actual_home: s.actualHome,
        actual_away: s.actualAway,
        scored_at: now,
      })
      .eq("id", s.id);
  }

  // 5. Recompute affected users' cached totals (SUM => idempotent).
  const userIds = [...new Set(preds.map((p) => p.user_id))];
  for (const uid of userIds) {
    const { data: rows } = await admin
      .from("predictions")
      .select("points")
      .eq("user_id", uid)
      .not("points", "is", null);
    const total = (rows ?? []).reduce(
      (a, r) => a + (r.points ?? 0),
      0,
    );
    await admin.from("profiles").update({ prediction_points: total }).eq("id", uid);
    await admin.from("league_members").update({ points: total }).eq("user_id", uid);
  }

  return Response.json({ scored: batch.length, users: userIds.length });
}

export const POST = run;
export const GET = run;
