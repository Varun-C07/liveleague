import { getAdminSupabase } from "@/lib/db/supabase-admin";
import { readCache } from "@/lib/db/cache";
import { codeFromName } from "@/lib/normalize";
import { fetchEspnSoccer } from "@/lib/espn-soccer";
import { fetchMatchDetail } from "@/lib/espn-summary";
import type { Match } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CachedMatches = { matches: Match[]; liveCount: number };

// Backfill / finalize per-match detail: for every finished soccer match that
// doesn't yet have a stored `ft` MatchDetail, resolve its ESPN event id (one
// scoreboard fetch per date, shared across that day's matches), pull the summary
// and store it. Idempotent + capped per run. Run once to backfill history, and
// on a schedule to finalize new results without waiting for a viewer.
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  return !!secret && req.headers.get("authorization") === `Bearer ${secret}`;
}

const MAX_PER_RUN = 40;

async function run(req: Request) {
  if (!authorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 });

  const cached = await readCache<CachedMatches>("soccer");
  const matches = cached?.payload?.matches ?? [];
  const finished = matches.filter((m) => m.st === "ft");
  if (finished.length === 0) return Response.json({ stored: 0, reason: "no_finished_matches" });

  const admin = getAdminSupabase();

  // Which finished matches already have a final stored detail?
  const ids = finished.map((m) => `soccer-${m.n}`);
  const { data: existing } = await admin
    .from("match_details")
    .select("match_id, status")
    .in("match_id", ids);
  const done = new Set((existing ?? []).filter((r) => r.status === "ft").map((r) => r.match_id));

  const todo = finished.filter((m) => !done.has(`soccer-${m.n}`)).slice(0, MAX_PER_RUN);
  if (todo.length === 0) return Response.json({ stored: 0, remaining: 0, reason: "all_backfilled" });

  // Resolve ESPN event ids: one scoreboard fetch per distinct match date.
  const dates = [...new Set(todo.map((m) => m.utc.slice(0, 10)))];
  const idByPair = new Map<string, string>();
  await Promise.all(
    dates.map(async (d) => {
      try {
        const events = await fetchEspnSoccer([d], 600);
        for (const ev of events) {
          const h = codeFromName(ev.strHomeTeam || "");
          const a = codeFromName(ev.strAwayTeam || "");
          if (ev.espnId && h && a) idByPair.set([h, a].sort().join("|"), ev.espnId);
        }
      } catch {
        /* skip this date */
      }
    }),
  );

  let stored = 0;
  for (const m of todo) {
    const espnId = m.espnId || idByPair.get([m.h, m.a].sort().join("|"));
    if (!espnId) continue;
    let detail;
    try {
      detail = await fetchMatchDetail(espnId, 600);
    } catch {
      detail = null;
    }
    if (!detail) continue;
    await admin.from("match_details").upsert(
      { match_id: `soccer-${m.n}`, espn_event_id: espnId, status: detail.status, payload: detail, updated_at: new Date().toISOString() },
      { onConflict: "match_id" },
    );
    if (detail.status === "ft") stored++;
  }

  const remaining = finished.filter((m) => !done.has(`soccer-${m.n}`)).length - stored;
  return Response.json({ stored, remaining: Math.max(0, remaining), processed: todo.length });
}

export const POST = run;
export const GET = run;
