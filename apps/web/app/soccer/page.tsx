import type { Metadata } from "next";
import { Soccer } from "@/components/design/screens/Soccer";
import { liveMatchesResponse, liveStandingsResponse } from "@/lib/snapshot";

export const metadata: Metadata = {
  title: "World Cup 2026 — Live Board · LiveLeagues",
  description:
    "Live board for the FIFA World Cup 2026 — all 104 matches, group standings, live scores and kickoff times.",
};

export const dynamic = "force-dynamic";

// Seed the client with the latest *stored* data (cache-first, instant) so the
// first paint is current — not the static snapshot. React Query keeps polling.
export default async function SoccerPage() {
  const [initialMatches, initialStandings] = await Promise.all([
    liveMatchesResponse(),
    liveStandingsResponse(),
  ]);
  return <Soccer initialMatches={initialMatches} initialStandings={initialStandings} />;
}
