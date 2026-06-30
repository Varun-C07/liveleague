import type { Match } from "@liveleague/core/types";
import type { DataSource } from "@liveleague/core/api-shape";
import { freshSchedule } from "@/lib/schedule";
import { applyEvents, type RawEvent } from "@/lib/normalize";
import { resolveKnockoutTeams, unresolvedKnockoutDates } from "@/lib/resolve-knockouts";
import { isRealTeam } from "@/data/teams";
import { readCache, writeCache } from "@/lib/db/cache";
import { fetchEspnSoccer } from "@/lib/espn-soccer";

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

// Live-window bounds (mirror clampLive): a match can be in play from ~10 min
// before kickoff to ~3.5 h after.
const PRE_LIVE_MS = 10 * 60_000;
const MAX_LIVE_MS = 3.5 * 60 * 60_000;
const DAY_MS = 86_400_000;

// Is the live feed worth hitting right now? True if a match is in its play window,
// just ended and we don't yet have its final result, OR there's a knockout slot
// whose teams aren't resolved yet and it's near (so the bracket fills in as rounds
// are decided). When false we never touch the upstream — page refreshes are free.
function liveWindowActive(matches: Match[], now: number): boolean {
  return matches.some((m) => {
    const ko = Date.parse(m.utc);
    if (Number.isNaN(ko)) return false;
    const inPlay = now >= ko - PRE_LIVE_MS && now <= ko + MAX_LIVE_MS;
    const recentUnresolved = ko < now && now - ko < DAY_MS && m.st !== "ft";
    const pendingKnockout =
      m.grp === null && (!isRealTeam(m.h) || !isRealTeam(m.a)) &&
      ko >= now - DAY_MS && ko <= now + 2 * DAY_MS;
    return inPlay || recentUnresolved || pendingKnockout;
  });
}

// ESPN dates to poll: the rolling now-window plus any upcoming/just-decided
// knockout days, so newly-set matchups resolve promptly.
function liveDates(matches: Match[], now: number): string[] {
  return [...new Set([...recentDates(new Date(now)), ...unresolvedKnockoutDates(matches, now)])];
}

// Pull live scores, then resolve any newly-decided knockout matchups and re-apply
// (so the resolved slots get their scores by team pair).
function applyAll(matches: Match[], events: RawEvent[], now: number): number {
  const { liveCount } = applyEvents(matches, events, now);
  if (resolveKnockoutTeams(matches, events) > 0) {
    return applyEvents(matches, events, now).liveCount;
  }
  return liveCount;
}

// Cache-first + live-gated. The schedule (dates, venues, teams) and finished
// results are STATIC — served straight from the stored cache with no API call.
// The live feed (ESPN, real-time) is hit ONLY while a match is in its window, so
// page reloads when nothing is live cost zero upstream requests.
export async function getMatches(live = true): Promise<ResolvedData> {
  const cached = await readCache<CachedMatches>("soccer");
  if (cached?.payload?.matches?.length) {
    const base = cached.payload.matches;
    if (liveWindowActive(base, Date.now())) {
      // A match is in play → overlay fresh live scores inline (bounded, deduped).
      return refreshLive(base);
    }
    // Nothing live → serve stored data, no upstream hit.
    return { source: "live", syncedAt: cached.syncedAt, liveCount: cached.payload.liveCount, matches: base };
  }
  // Cold cache (first ever / DB down): one-time full backfill from TheSportsDB.
  return refreshFull(live);
}

// Overlay just the live scores from ESPN onto the stored base, when a match is
// in play. Only the live day-window is fetched — nothing else is re-pulled.
async function refreshLive(base: Match[]): Promise<ResolvedData> {
  const matches = base.map((m) => ({ ...m })); // clone — applyEvents mutates
  const now = Date.now();
  try {
    const events = await fetchEspnSoccer(liveDates(matches, now), 10);
    if (events.length) applyAll(matches, events, now);
    const liveCount = matches.filter((m) => m.st === "live").length;
    await writeCache("soccer", { matches, liveCount } satisfies CachedMatches);
    return { source: "live", syncedAt: new Date().toISOString(), liveCount, matches };
  } catch {
    const liveCount = base.filter((m) => m.st === "live").length;
    return { source: "live", syncedAt: new Date().toISOString(), liveCount, matches: base };
  }
}

// Full backfill on a cold cache: TheSportsDB rounds/day for historical results,
// plus ESPN for anything live, merged (ESPN last so live scores win). Runs ~once
// (the cache persists across deploys in Supabase), not on every request.
async function refreshFull(live = true): Promise<ResolvedData> {
  const matches = freshSchedule();
  const now = Date.now();
  try {
    const [tsdb, espn] = await Promise.all([
      fetchUpstream(live).catch(() => [] as RawEvent[]),
      fetchEspnSoccer(liveDates(matches, now), 10).catch(() => [] as RawEvent[]),
    ]);
    const events = [...tsdb, ...espn];
    if (!events.length) throw new Error("no events");
    const liveCount = applyAll(matches, events, now);
    await writeCache("soccer", { matches, liveCount } satisfies CachedMatches);
    return { source: "live", syncedAt: new Date().toISOString(), liveCount, matches };
  } catch {
    const cached = await readCache<CachedMatches>("soccer");
    if (cached?.payload?.matches?.length) {
      return { source: "snapshot", syncedAt: cached.syncedAt, liveCount: cached.payload.liveCount, matches: cached.payload.matches };
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

const FETCH_TIMEOUT_MS = 7000; // bound a slow upstream so a request can't hang

async function fetchJSON(
  url: string,
  revalidate: number,
  headers?: Record<string, string>,
): Promise<Record<string, unknown> | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", ...(headers || {}) },
      next: { revalidate, tags: ["wc-data"] },
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return (await res.json()) as Record<string, unknown>;
  } finally {
    clearTimeout(timer);
  }
}
