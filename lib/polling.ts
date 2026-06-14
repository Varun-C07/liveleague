import type { MatchesResponse } from "@/lib/api-shape";

// Adaptive refetch interval: fast while a match is live, medium when one is
// about to start, slow when idle. Returned in milliseconds.
export const POLL = { live: 15_000, soon: 60_000, idle: 300_000 } as const;

export function intervalFor(data: MatchesResponse | undefined): number {
  if (!data) return POLL.soon;
  if (data.liveCount > 0) return POLL.live;
  const now = Date.now();
  const soon = data.matches.some((m) => {
    if (m.status !== "sched") return false;
    const t = new Date(m.utc).getTime() - now;
    return t > 0 && t <= 30 * 60_000;
  });
  return soon ? POLL.soon : POLL.idle;
}
