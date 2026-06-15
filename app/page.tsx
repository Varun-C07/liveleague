import { HomeBoard } from "@/components/home/HomeBoard";
import { snapshotOverview } from "@/lib/sports/overview";

// Server-seed the cross-sport overview so first paint is never blank;
// React Query then swaps in live data from /api/live.
export default function Home() {
  return <HomeBoard initial={snapshotOverview()} />;
}
