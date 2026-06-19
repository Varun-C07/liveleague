import type { Match } from "@/lib/types";
import type { DataSource } from "@/lib/api-shape";
import { freshSchedule } from "@/lib/schedule";
import { applyEvents, type RawEvent } from "@/lib/normalize";
import { readCache, writeCache } from "@/lib/db/cache";

// Upstream adapter. The free v1 `eventsseason` endpoint is capped at 15 results,
// which froze the board after the 15th match (15 Jun). Instead we assemble the
// full result set from the uncapped free endpoints — `eventsround` per group
// round (72 group matches) plus a rolling `eventsday` window (live + knockouts
// as they populate). A premium v2 `livescore` path stays behind TSDB_PREMIUM.

const KEY = process.env.TSDB_API_KEY || "123";
const BASE = process.env.TSDB_API_BASE || "https://www.thesportsdb.com/api";
const PREMIUM = process.env.TSDB_PREMIUM === "true";
const WC_LEAGUE = "4429";
const SEASON = "2026";

// Group-stage rounds (knockout rounds appear later and are covered by the day
// window). `eventsround` returns the full round, uncapped.
const GROUP_ROUNDS = [1, 2, 3];

export type ResolvedData = {
  source: DataSource;
  syncedAt: string;
  liveCount: number;
  matches: Match[];
};

type CachedMatches = { matches: Match[]; liveCount: number };

// `live` hints the cache window (shorter when matches may be in play).
export async function getMatches(live = true): Promise<ResolvedData> {
  const matches = freshSchedule();
  try {
    const events = await fetchUpstream(live);
    if (!events.length) throw new Error("no events");
    const { liveCount } = applyEvents(matches, events);
    // Write-through: persist the freshest real data for the outage path below.
    await writeCache("soccer", { matches, liveCount } satisfies CachedMatches);
    return { source: "live", syncedAt: new Date().toISOString(), liveCount, matches };
  } catch {
    // Upstream unreachable: serve the last *real* scraped data if we have it,
    // falling back to the static snapshot only when the cache is empty.
    const cached = await readCache<CachedMatches>("soccer");
    if (cached?.payload?.matches?.length) {
      return {
        source: "snapshot",
        syncedAt: cached.syncedAt,
        liveCount: cached.payload.liveCount,
        matches: cached.payload.matches,
      };
    }
    const liveCount = matches.filter((m) => m.st === "live").length;
    return { source: "snapshot", syncedAt: new Date().toISOString(), liveCount, matches };
  }
}

// Finished results never change, so the bulk round fetches are cached for a
// long window; only the small live/today day-window is polled frequently. This
// means we re-hit upstream only for the data that can still change — already
// stored results aren't fetched again.
const ROUND_REVALIDATE = 1800; // 30 min — group rounds (mostly finished)

async function fetchUpstream(live: boolean): Promise<RawEvent[]> {
  const dayRevalidate = live ? 20 : 120;

  // Premium v2 livescore (env-gated) merged over the full fixture set.
  if (PREMIUM) {
    const [base, scores] = await Promise.all([
      fetchAllEvents(dayRevalidate),
      fetchJSON(`${BASE}/v2/json/livescore/soccer`, dayRevalidate, { "X-API-KEY": KEY }).catch(() => null),
    ]);
    const liveEvents = (scores?.livescore as RawEvent[]) || [];
    return mergeLive(base, liveEvents);
  }

  return fetchAllEvents(dayRevalidate);
}

// Assemble the full result set from uncapped free endpoints. `applyEvents`
// matches by team pair and overwrites per match, so overlapping results across
// rounds/days are harmless — day results come last so the freshest status wins.
// Rounds use a long cache (immutable, already-stored results); the day window
// uses the short cache so a live score still refreshes within seconds.
async function fetchAllEvents(dayRevalidate: number): Promise<RawEvent[]> {
  const roundUrls = GROUP_ROUNDS.map(
    (r) => ({ url: `${BASE}/v1/json/${KEY}/eventsround.php?id=${WC_LEAGUE}&r=${r}&s=${SEASON}`, rev: ROUND_REVALIDATE }),
  );
  const dayUrls = recentDates().map(
    (d) => ({ url: `${BASE}/v1/json/${KEY}/eventsday.php?d=${d}&l=${WC_LEAGUE}`, rev: dayRevalidate }),
  );
  const lists = await Promise.all(
    [...roundUrls, ...dayUrls].map(({ url, rev }) =>
      fetchJSON(url, rev)
        .then((j) => (j?.events as RawEvent[]) || [])
        .catch(() => [] as RawEvent[]),
    ),
  );
  return lists.flat();
}

// Rolling UTC date window (yesterday → tomorrow) for the day endpoint: covers
// in-play matches and, later, knockout fixtures without hard-coding round ids.
function recentDates(now: Date = new Date()): string[] {
  const ymd = (ms: number) => new Date(ms).toISOString().slice(0, 10);
  const day = 86_400_000;
  const t = now.getTime();
  return [ymd(t - day), ymd(t), ymd(t + day)];
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
