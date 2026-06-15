import type { SportAdapter, LiveBundle } from "./types";
import { sportMeta } from "./meta";
import { CRICKET_SNAPSHOT } from "@/data/snapshots/cricket";

const META = sportMeta("cricket")!;

// Cricket ships snapshot-first for v1: free live cricket feeds (TheSportsDB /
// ESPN) are thin and inconsistent to parse (scores like "287/6 (48.2)"), so we
// serve a verified fixture set behind the same adapter contract. A real upstream
// (CricAPI / ESPN cricket) can be slotted into getLive() later with no UI change.
export const cricketAdapter: SportAdapter = {
  ...META,
  async getLive(): Promise<LiveBundle> {
    return this.snapshot();
  },
  snapshot(): LiveBundle {
    return {
      sport: "cricket",
      source: "snapshot",
      syncedAt: new Date().toISOString(),
      liveCount: CRICKET_SNAPSHOT.filter((g) => g.status === "live").length,
      games: CRICKET_SNAPSHOT,
    };
  },
};
