import type { MatchesResponse } from "@/lib/api-shape";
import type { GameStatus } from "@/lib/sports/types";

// Adaptive refetch interval: fast while something is live, medium when one is
// about to start, slow when idle. Returned in milliseconds.
export const POLL = { live: 15_000, soon: 60_000, idle: 300_000 } as const;

// Generic core: decide an interval from a live count + a list of scheduled
// start times. Shared by soccer (matches) and the generic Game/overview hooks.
export function intervalFromLive(
  liveCount: number,
  scheduled: { status: GameStatus | "ft"; utc: string }[],
): number {
  if (liveCount > 0) return POLL.live;
  const now = Date.now();
  const soon = scheduled.some((g) => {
    if (g.status !== "sched") return false;
    const t = new Date(g.utc).getTime() - now;
    return t > 0 && t <= 30 * 60_000;
  });
  return soon ? POLL.soon : POLL.idle;
}

export function intervalFor(data: MatchesResponse | undefined): number {
  if (!data) return POLL.soon;
  return intervalFromLive(data.liveCount, data.matches);
}
