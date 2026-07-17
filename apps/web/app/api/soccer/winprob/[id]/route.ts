import { NextResponse } from "next/server";
import { readCache } from "@/lib/db/cache";
import { requirePersonal, gateErrorResponse } from "@/lib/entitlements";
import { PAYWALL_ENABLED } from "@liveleagues/core/gating";
import { TEAMS, isRealTeam } from "@/data/teams";
import { ELO_SEED, DEFAULT_ELO, HOST_CODES } from "@/data/eloRatings";
import { computeRatings, matchProbabilities, inPlayProbabilities } from "@liveleagues/core/win-prob";
import type { Match } from "@liveleagues/core/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CachedMatches = { matches: Match[]; liveCount: number };

const teamName = (code: string) => TEAMS[code]?.name ?? code;

// PAID: real win probability is part of the $5 World Cup Bundle. The gate here is
// the authoritative enforcement — free users never receive these numbers (the UI
// shows a clearly-labelled sample instead).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  // Paywall on → require the $5 bundle. Paywall off → open to everyone (incl. anon).
  if (PAYWALL_ENABLED) {
    try {
      await requirePersonal();
    } catch (e) {
      const res = gateErrorResponse(e);
      if (res) return res;
      throw e;
    }
  }

  const { id } = await params;
  const n = Number(id.replace(/^soccer-/, ""));

  const cached = await readCache<CachedMatches>("soccer");
  const matches = cached?.payload?.matches ?? [];
  const m = matches.find((x) => x.n === n) ?? null;
  if (!m) return NextResponse.json({ error: "unknown_match" }, { status: 404 });

  // Placeholder slots ("2A", "W74") have no rating → no real prediction.
  if (!isRealTeam(m.h) || !isRealTeam(m.a)) {
    return NextResponse.json({ unavailable: true }, { status: 404 });
  }

  const ratings = computeRatings(matches, ELO_SEED, HOST_CODES, DEFAULT_ELO);
  const rh = ratings[m.h] ?? DEFAULT_ELO;
  const ra = ratings[m.a] ?? DEFAULT_ELO;
  const isHostHome = HOST_CODES.has(m.h);
  const hName = teamName(m.h);
  const aName = teamName(m.a);

  // normalize.ts attaches a live `minute` string onto the match object.
  const minute = (m as Match & { minute?: string | null }).minute ?? null;
  const wp =
    m.st === "live"
      ? inPlayProbabilities(rh, ra, isHostHome, m.hs ?? 0, m.as ?? 0, minute, hName, aName)
      : matchProbabilities(rh, ra, isHostHome, hName, aName);

  const sMaxAge = m.st === "live" ? 15 : 600;
  return NextResponse.json(wp, {
    headers: { "Cache-Control": `public, s-maxage=${sMaxAge}, stale-while-revalidate=120` },
  });
}
