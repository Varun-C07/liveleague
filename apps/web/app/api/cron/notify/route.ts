import { getAdminSupabase } from "@/lib/db/supabase-admin";
import { soccerAdapter } from "@/lib/sports/soccer";
import type { Game } from "@liveleague/core/sports/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Generates in-app notifications for kickoff (status → live) and full-time
// (status → final) on matches involving a user's followed teams. Scheduled
// every ~minute by Supabase pg_cron (Authorization: Bearer CRON_SECRET).
//
// Idempotent by construction: the notifications table has a unique
// (user_id, match_id, type) key, so re-running while a match stays live/final
// never duplicates an alert — no last-seen-state bookkeeping required.
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  return !!secret && req.headers.get("authorization") === `Bearer ${secret}`;
}

type Row = {
  user_id: string;
  type: "kickoff" | "fulltime";
  sport: string;
  match_id: string;
  title: string;
  body: string;
  payload: Record<string, unknown>;
};

function kickoffCopy(g: Game) {
  return {
    title: `Kick-off: ${g.home.name} v ${g.away.name}`,
    body: `${g.label} is under way.`,
  };
}

function fulltimeCopy(g: Game) {
  const hs = g.home.score;
  const as = g.away.score;
  const score = hs != null && as != null ? ` ${hs}–${as} ` : " ";
  return {
    title: `Full-time: ${g.home.name}${score}${g.away.name}`,
    body: `${g.label} has finished.`,
  };
}

async function run(req: Request) {
  if (!authorized(req)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const admin = getAdminSupabase();

  let bundle;
  try {
    bundle = await soccerAdapter.getLive(true);
  } catch {
    bundle = soccerAdapter.snapshot();
  }

  // Matches that warrant an alert right now, paired with the alert type.
  const events: { g: Game; type: "kickoff" | "fulltime" }[] = [];
  for (const g of bundle.games) {
    if (g.status === "live") events.push({ g, type: "kickoff" });
    else if (g.status === "final") events.push({ g, type: "fulltime" });
  }
  if (events.length === 0) {
    return Response.json({ created: 0, reason: "no_active_matches" });
  }

  // Which followed team codes are involved → one query for their followers.
  const codes = new Set<string>();
  for (const { g } of events) {
    if (g.home.real !== false) codes.add(g.home.code);
    if (g.away.real !== false) codes.add(g.away.code);
  }
  const { data: follows } = await admin
    .from("followed_teams")
    .select("user_id, team_code")
    .eq("sport", "soccer")
    .in("team_code", [...codes]);
  if (!follows || follows.length === 0) {
    return Response.json({ created: 0, reason: "no_followers" });
  }

  const followersByCode = new Map<string, string[]>();
  for (const f of follows) {
    const arr = followersByCode.get(f.team_code) ?? [];
    arr.push(f.user_id);
    followersByCode.set(f.team_code, arr);
  }

  // Fan out, de-duplicating users who follow both teams in the same match.
  const rows: Row[] = [];
  for (const { g, type } of events) {
    const users = new Set([
      ...(followersByCode.get(g.home.code) ?? []),
      ...(followersByCode.get(g.away.code) ?? []),
    ]);
    if (users.size === 0) continue;
    const copy = type === "kickoff" ? kickoffCopy(g) : fulltimeCopy(g);
    for (const user_id of users) {
      rows.push({
        user_id,
        type,
        sport: "soccer",
        match_id: g.id,
        title: copy.title,
        body: copy.body,
        payload: { n: g.id, href: "/soccer", stage: g.label },
      });
    }
  }
  if (rows.length === 0) {
    return Response.json({ created: 0, reason: "no_matched_followers" });
  }

  // ignoreDuplicates => existing (user, match, type) rows are skipped, so this
  // only ever inserts the first kickoff / full-time alert per user per match.
  const { data: inserted } = await admin
    .from("notifications")
    .upsert(rows, { onConflict: "user_id,match_id,type", ignoreDuplicates: true })
    .select("id");

  return Response.json({ created: inserted?.length ?? 0, candidates: rows.length });
}

export const POST = run;
export const GET = run;
