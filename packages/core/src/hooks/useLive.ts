"use client";
// Live-data hooks shared by the web app and the Expo mobile app. They fetch the
// server's /api/* routes via relative URLs; the mobile app rewrites those to the
// deployed origin (see apps/mobile lib/apiBase.ts). Kept out of the package
// barrel (index.ts) so pure-logic importers stay React-free — import from the
// subpath: `@liveleagues/core/hooks/useLive`.
import { useQuery } from "@tanstack/react-query";
import type { AgendaResponse, LiveBundle, LiveOverview, SportId } from "../sports/types";
import { POLL, intervalFromLive } from "../polling";

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json() as Promise<T>;
}

// Home page: the cross-sport overview, polled adaptively (fast if anything live).
export function useOverview(initial: LiveOverview) {
  return useQuery({
    queryKey: ["overview"],
    queryFn: () => fetchJSON<LiveOverview>("/api/live"),
    initialData: initial,
    refetchInterval: (q) => {
      const d = q.state.data as LiveOverview | undefined;
      if (!d) return POLL.soon;
      return intervalFromLive(
        d.totalLive,
        d.sports.flatMap((s) => s.topGames),
      );
    },
  });
}

// Score ticker: same ["overview"] query the home page uses, so it shares the
// seeded cache on Home and fetches the same aggregate elsewhere (no new fetch).
// `initial` is optional: the web ticker shares Home's cache (no seed), while the
// mobile app passes a bundled snapshot so it renders instantly and survives a
// backend outage. With the mobile QueryClient's staleTime:0 the seed is treated
// as stale, so a live fetch still fires on mount.
export function useLiveTicker(initial?: LiveOverview) {
  return useQuery({
    queryKey: ["overview"],
    queryFn: () => fetchJSON<LiveOverview>("/api/live"),
    ...(initial ? { initialData: initial } : {}),
    refetchInterval: (q) => {
      const d = q.state.data as LiveOverview | undefined;
      if (!d) return POLL.soon;
      return intervalFromLive(d.totalLive, d.sports.flatMap((s) => s.topGames));
    },
  });
}

// Cross-sport agenda (My Day / Week / Month).
export function useAgenda(initial: AgendaResponse) {
  return useQuery({
    queryKey: ["agenda"],
    queryFn: () => fetchJSON<AgendaResponse>("/api/agenda"),
    initialData: initial,
    refetchInterval: (q) => {
      const d = q.state.data as AgendaResponse | undefined;
      if (!d) return POLL.soon;
      return intervalFromLive(d.games.filter((g) => g.status === "live").length, d.games);
    },
  });
}

// Per-sport board: the full LiveBundle for one sport.
export function useLiveBundle(sport: SportId, initial: LiveBundle) {
  return useQuery({
    queryKey: ["sport", sport],
    queryFn: () => fetchJSON<LiveBundle>(`/api/${sport}`),
    initialData: initial,
    refetchInterval: (q) => {
      const d = q.state.data as LiveBundle | undefined;
      if (!d) return POLL.soon;
      return intervalFromLive(d.liveCount, d.games);
    },
  });
}
