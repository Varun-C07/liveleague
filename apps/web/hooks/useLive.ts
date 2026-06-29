"use client";
import { useQuery } from "@tanstack/react-query";
import type { AgendaResponse, LiveBundle, LiveOverview, SportId } from "@liveleague/core/sports/types";
import { POLL, intervalFromLive } from "@liveleague/core/polling";

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
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
export function useLiveTicker() {
  return useQuery({
    queryKey: ["overview"],
    queryFn: () => fetchJSON<LiveOverview>("/api/live"),
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
