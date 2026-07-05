"use client";
// Soccer fixtures + standings hooks, shared by web and mobile. See useLive.ts
// for why these live in packages/core and are imported via the subpath
// `@liveleagues/core/hooks/useMatches` rather than the barrel.
import { useQuery } from "@tanstack/react-query";
import type { MatchesResponse, StandingsResponse } from "../api-shape";
import { intervalFor } from "../polling";

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json() as Promise<T>;
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
