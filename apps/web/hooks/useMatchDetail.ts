"use client";

import { useQuery } from "@tanstack/react-query";
import type { MatchDetail } from "@/lib/espn-summary";

async function fetchDetail(matchId: string): Promise<MatchDetail | null> {
  const res = await fetch(`/api/soccer/match/${matchId}`);
  if (res.status === 404) return null; // no detail available (e.g. not kicked off)
  if (!res.ok) throw new Error("detail_failed");
  return res.json();
}

// Rich detail for one match. Polls while the match is live; fetched once and then
// served from cache (DB-backed) for finished games. `enabled` gates the fetch so
// we only load when a panel is actually open.
export function useMatchDetail(matchId: string, opts: { enabled: boolean; live: boolean }) {
  const query = useQuery({
    queryKey: ["match-detail", matchId],
    queryFn: () => fetchDetail(matchId),
    enabled: opts.enabled,
    staleTime: opts.live ? 10_000 : 5 * 60_000,
    refetchInterval: opts.enabled && opts.live ? 15_000 : false,
  });
  return {
    detail: query.data ?? null,
    loading: opts.enabled ? query.isLoading : false,
    error: query.isError,
  };
}
