"use client";

import { useQuery } from "@tanstack/react-query";
import { useEntitlements } from "@/hooks/useEntitlements";
import type { WinProb } from "@liveleagues/core/win-prob";

async function fetchWinProb(matchId: string): Promise<WinProb | null> {
  const res = await fetch(`/api/soccer/winprob/${matchId}`);
  if (res.status === 404) return null; // placeholder teams / unknown match
  if (!res.ok) throw new Error("winprob_failed"); // 401/403 handled by `enabled`
  return res.json();
}

// Real (paid) win probability for one match. Only fetches for entitled users — the
// server route is the real gate, but gating the fetch avoids a guaranteed 403 for
// free users, who see the sample tease instead. Polls while the match is live.
export function useWinProb(matchId: string, opts: { enabled: boolean; live: boolean }) {
  const { hasPersonal } = useEntitlements();
  const enabled = opts.enabled && hasPersonal;
  const query = useQuery({
    queryKey: ["winprob", matchId],
    queryFn: () => fetchWinProb(matchId),
    enabled,
    staleTime: opts.live ? 10_000 : 5 * 60_000,
    refetchInterval: enabled && opts.live ? 15_000 : false,
  });
  return {
    winProb: query.data ?? null,
    entitled: hasPersonal,
    loading: enabled ? query.isLoading : false,
  };
}
