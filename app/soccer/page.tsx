import type { Metadata } from "next";
import { Board } from "@/components/soccer/Board";
import { snapshotMatches, snapshotStandings } from "@/lib/snapshot";

export const metadata: Metadata = {
  title: "World Cup 2026 — Live Board · Live League",
  description:
    "Live board for the FIFA World Cup 2026 — all 104 matches, group standings, live scores and kickoff times.",
};

// Seed the client with a verified snapshot so first paint is never blank;
// React Query then swaps in live data from /api/soccer.
export default function SoccerPage() {
  return <Board initialMatches={snapshotMatches()} initialStandings={snapshotStandings()} />;
}
