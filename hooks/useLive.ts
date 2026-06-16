"use client";
import { useQuery } from "@tanstack/react-query";
import type { AgendaResponse, LiveBundle, LiveOverview, SportId } from "@/lib/sports/types";
import { POLL, intervalFromLive } from "@/lib/polling";

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
