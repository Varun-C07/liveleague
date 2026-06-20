"use client";
import { useQuery } from "@tanstack/react-query";
import type { MatchesResponse, StandingsResponse } from "@/lib/api-shape";
import { intervalFor } from "@/lib/polling";

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}

export function useMatches(initial: MatchesResponse) {
  return useQuery({
    queryKey: ["soccer", "matches"],
    queryFn: () => fetchJSON<MatchesResponse>("/api/soccer"),
    initialData: initial,
    refetchInterval: (q) => intervalFor(q.state.data as MatchesResponse | undefined),
  });
}

export function useStandings(initial: StandingsResponse) {
  return useQuery({
    queryKey: ["soccer", "standings"],
    queryFn: () => fetchJSON<StandingsResponse>("/api/soccer/standings"),
    initialData: initial,
    refetchInterval: 30_000,
  });
}
