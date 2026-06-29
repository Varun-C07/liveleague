"use client";

import { useQuery } from "@tanstack/react-query";
import type { RaceDetail } from "@/lib/jolpica-race";

async function fetchDetail(gameId: string): Promise<RaceDetail | null> {
  const res = await fetch(`/api/f1/race/${gameId}`);
  if (res.status === 404) return null; // no results yet (race not run)
  if (!res.ok) throw new Error("race_detail_failed");
  return res.json();
}

// Rich detail for one Grand Prix. F1 is post-session (results/quali/pits appear
// after each session), so fetched once when the popup opens — `live` only nudges
// a slow refetch on race day. Finished races are served from the DB.
export function useRaceDetail(gameId: string, opts: { enabled: boolean; live: boolean }) {
  const query = useQuery({
    queryKey: ["race-detail", gameId],
    queryFn: () => fetchDetail(gameId),
    enabled: opts.enabled,
    staleTime: opts.live ? 60_000 : 60 * 60_000,
    refetchInterval: opts.enabled && opts.live ? 120_000 : false,
  });
  return { detail: query.data ?? null, loading: opts.enabled ? query.isLoading : false, error: query.isError };
}
