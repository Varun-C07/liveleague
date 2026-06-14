import { Board } from "@/components/Board";
import { snapshotMatches, snapshotStandings } from "@/lib/snapshot";

// Seed the client with a verified snapshot so first paint is never blank;
// React Query then swaps in live data from /api/*.
export default function Home() {
  return <Board initialMatches={snapshotMatches()} initialStandings={snapshotStandings()} />;
}
