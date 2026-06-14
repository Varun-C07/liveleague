import type { Match } from "@/lib/types";
import type { DataSource } from "@/lib/api-shape";
import { freshSchedule } from "@/lib/schedule";
import { applyEvents, type RawEvent } from "@/lib/normalize";

// Upstream adapter. Free v1 `eventsseason` now; a premium v2 `livescore` path
// can be slotted in behind TSDB_PREMIUM later without any client change.

const KEY = process.env.TSDB_API_KEY || "123";
const BASE = process.env.TSDB_API_BASE || "https://www.thesportsdb.com/api";
const PREMIUM = process.env.TSDB_PREMIUM === "true";
const WC_LEAGUE = "4429";
const SEASON = "2026";

export type ResolvedData = {
  source: DataSource;
  syncedAt: string;
  liveCount: number;
  matches: Match[];
};

// `live` hints the cache window (shorter when matches may be in play).
export async function getMatches(live = true): Promise<ResolvedData> {
  const matches = freshSchedule();
  try {
    const events = await fetchUpstream(live);
    if (!events.length) throw new Error("no events");
    const { liveCount } = applyEvents(matches, events);
    return { source: "live", syncedAt: new Date().toISOString(), liveCount, matches };
  } catch {
    // Snapshot fallback: schedule already carries verified results.
    const liveCount = matches.filter((m) => m.st === "live").length;
    return { source: "snapshot", syncedAt: new Date().toISOString(), liveCount, matches };
  }
}

async function fetchUpstream(live: boolean): Promise<RawEvent[]> {
  const revalidate = live ? 20 : 120;

  // Premium v2 livescore (env-gated) merged over the season fixtures.
  if (PREMIUM) {
    const [season, scores] = await Promise.all([
      fetchSeason(revalidate),
      fetchJSON(`${BASE}/v2/json/livescore/soccer`, revalidate, { "X-API-KEY": KEY }).catch(() => null),
    ]);
    const liveEvents = (scores?.livescore as RawEvent[]) || [];
    return mergeLive(season, liveEvents);
  }

  return fetchSeason(revalidate);
}

async function fetchSeason(revalidate: number): Promise<RawEvent[]> {
  const url = `${BASE}/v1/json/${KEY}/eventsseason.php?id=${WC_LEAGUE}&s=${SEASON}`;
  const j = await fetchJSON(url, revalidate);
  return (j?.events as RawEvent[]) || [];
}

function mergeLive(season: RawEvent[], live: RawEvent[]): RawEvent[] {
  if (!live.length) return season;
  const key = (e: RawEvent) => `${e.strHomeTeam}|${e.strAwayTeam}`;
  const map = new Map(season.map((e) => [key(e), e]));
  for (const ev of live) map.set(key(ev), { ...map.get(key(ev)), ...ev });
  return [...map.values()];
}

async function fetchJSON(
  url: string,
  revalidate: number,
  headers?: Record<string, string>,
): Promise<Record<string, unknown> | null> {
  const res = await fetch(url, {
    headers: { Accept: "application/json", ...(headers || {}) },
    next: { revalidate, tags: ["wc-data"] },
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return (await res.json()) as Record<string, unknown>;
}
