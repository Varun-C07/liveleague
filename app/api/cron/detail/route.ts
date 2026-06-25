import { getAdminSupabase } from "@/lib/db/supabase-admin";
import { readCache } from "@/lib/db/cache";
import { codeFromName } from "@/lib/normalize";
import { fetchEspnSoccer } from "@/lib/espn-soccer";
import { fetchMatchDetail } from "@/lib/espn-summary";
import { fetchRaceDetail } from "@/lib/jolpica-race";
import type { Match } from "@/lib/types";
import type { LiveBundle } from "@/lib/sports/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CachedMatches = { matches: Match[]; liveCount: number };

// Backfill / finalize per-game detail for both sports: store the rich detail of
// every finished game that doesn't yet have a stored `ft` row, so past games are
// pre-populated (no first-viewer fetch). Idempotent + capped per run.
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  return !!secret && req.headers.get("authorization") === `Bearer ${secret}`;
}

const MAX_PER_RUN = 40;

// Which of these match ids already have a final stored detail?
async function alreadyFinal(admin: SupabaseClient, ids: string[]): Promise<Set<string>> {
  const { data } = await admin.from("match_details").select("match_id, status").in("match_id", ids);
  return new Set((data ?? []).filter((r) => r.status === "ft").map((r) => r.match_id));
}

async function backfillSoccer(admin: SupabaseClient): Promise<{ stored: number; remaining: number }> {
  const cached = await readCache<CachedMatches>("soccer");
  const finished = (cached?.payload?.matches ?? []).filter((m) => m.st === "ft");
  if (finished.length === 0) return { stored: 0, remaining: 0 };

  const done = await alreadyFinal(admin, finished.map((m) => `soccer-${m.n}`));
  const todo = finished.filter((m) => !done.has(`soccer-${m.n}`)).slice(0, MAX_PER_RUN);
  if (todo.length === 0) return { stored: 0, remaining: 0 };

  // Resolve ESPN ids: one scoreboard fetch per distinct date.
  const idByPair = new Map<string, string>();
  await Promise.all(
    [...new Set(todo.map((m) => m.utc.slice(0, 10)))].map(async (d) => {
      try {
        for (const ev of await fetchEspnSoccer([d], 600)) {
          const h = codeFromName(ev.strHomeTeam || "");
          const a = codeFromName(ev.strAwayTeam || "");
          if (ev.espnId && h && a) idByPair.set([h, a].sort().join("|"), ev.espnId);
        }
      } catch {
        /* skip date */
      }
    }),
  );

  let stored = 0;
  for (const m of todo) {
    const espnId = m.espnId || idByPair.get([m.h, m.a].sort().join("|"));
    if (!espnId) continue;
    const detail = await fetchMatchDetail(espnId, 600).catch(() => null);
    if (!detail) continue;
    await admin.from("match_details").upsert(
      { match_id: `soccer-${m.n}`, espn_event_id: espnId, status: detail.status, payload: detail, updated_at: new Date().toISOString() },
      { onConflict: "match_id" },
    );
    if (detail.status === "ft") stored++;
  }
  return { stored, remaining: finished.filter((m) => !done.has(`soccer-${m.n}`)).length - stored };
}

async function backfillF1(admin: SupabaseClient): Promise<{ stored: number; remaining: number }> {
  const cached = await readCache<LiveBundle>("f1");
  const finished = (cached?.payload?.games ?? []).filter((g) => g.status === "final");
  if (finished.length === 0) return { stored: 0, remaining: 0 };

  const done = await alreadyFinal(admin, finished.map((g) => g.id));
  const todo = finished.filter((g) => !done.has(g.id)).slice(0, MAX_PER_RUN);
  if (todo.length === 0) return { stored: 0, remaining: 0 };

  let stored = 0;
  for (const g of todo) {
    const round = Number(g.id.replace(/^f1-/, ""));
    if (!round) continue;
    const detail = await fetchRaceDetail(round, 600).catch(() => null);
    if (!detail || detail.status !== "ft") continue;
    await admin.from("match_details").upsert(
      { match_id: g.id, espn_event_id: null, status: detail.status, payload: detail, updated_at: new Date().toISOString() },
      { onConflict: "match_id" },
    );
    stored++;
  }
  return { stored, remaining: finished.filter((g) => !done.has(g.id)).length - stored };
}

async function run(req: Request) {
  if (!authorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const admin = getAdminSupabase();
  const soccer = await backfillSoccer(admin);
  const f1 = await backfillF1(admin);
  return Response.json({
    soccer,
    f1,
    remaining: Math.max(0, soccer.remaining) + Math.max(0, f1.remaining),
  });
}

export const POST = run;
export const GET = run;
