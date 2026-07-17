"use client";

// ─────────────────────────────────────────────────────────────────────────────
// DEV ONLY: force a demo live match so the live UI (hero + ticker motion) lights
// up while the real feed has nothing live. ALL fake "live" values live HERE — no
// component hardcodes them. When the flag is OFF, withDemoLive() returns the data
// untouched and useDemoNow() never ticks, so behavior is exactly as in production.
//
// Turn ON: set NEXT_PUBLIC_LL_DEMO_LIVE=1 (restart dev), or flip DEMO_LIVE_FORCE
// to true below. Leave OFF (false / unset) for production.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import type { Game, LiveOverview } from "@liveleagues/core/sports/types";
import { TEAMS } from "@/data/teams";

const DEMO_LIVE_FORCE = false; // DEV ONLY — flip to true to force the demo match
export const DEMO_LIVE =
  DEMO_LIVE_FORCE || process.env.NEXT_PUBLIC_LL_DEMO_LIVE === "1";

// A ticking clock only while the demo flag is on. Returns 0 (no interval, no
// re-renders) when off, so production is unaffected.
export function useDemoNow(): number {
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!DEMO_LIVE) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// Build one fake live soccer match whose minute + score derive purely from `now`
// (demo-accelerated so it's observable: minute ticks ~every 5s, scores change
// ~every 20s / 33s). Real teams so the flags render.
function buildDemoMatch(now: number): Game {
  const sec = Math.floor(now / 1000);
  const minute = 60 + (Math.floor(sec / 5) % 35); // 60'..94', ticks every 5s
  const homeScore = Math.floor(sec / 20) % 4; // changes ~every 20s
  const awayScore = Math.floor(sec / 33) % 3; // changes ~every 33s
  return {
    id: "demo-live",
    sport: "soccer",
    status: "live",
    utc: new Date(now || Date.parse("2026-06-21T18:00:00Z")).toISOString(),
    approx: false,
    label: "Demo · Group X",
    home: { code: "BRA", name: TEAMS.BRA.name, color: TEAMS.BRA.color, score: homeScore },
    away: { code: "ESP", name: TEAMS.ESP.name, color: TEAMS.ESP.color, score: awayScore },
    extra: { sport: "soccer", grp: "X", minute: String(minute), stage: "Demo" },
  } as Game;
}

// THE integration seam: components read live state from here. When the flag is
// on, inject the demo match at the front of soccer's top games (so mapFeatured
// picks it as live and the ticker shows it first). When off, identity.
export function withDemoLive(
  ov: LiveOverview | undefined,
  now: number,
): LiveOverview | undefined {
  if (!DEMO_LIVE || !ov) return ov;
  const demo = buildDemoMatch(now);
  return {
    ...ov,
    totalLive: ov.totalLive + 1,
    sports: ov.sports.map((s) =>
      s.id === "soccer"
        ? { ...s, liveCount: s.liveCount + 1, topGames: [demo, ...s.topGames].slice(0, 3) }
        : s,
    ),
  };
}
