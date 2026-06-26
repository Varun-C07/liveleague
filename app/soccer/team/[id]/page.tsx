import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Team } from "@/components/design/screens/Team";
import { liveMatchesResponse, liveStandingsResponse } from "@/lib/snapshot";
import { TEAMS } from "@/data/teams";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const team = TEAMS[id.toUpperCase() as keyof typeof TEAMS];
  return { title: team ? `${team.name} — World Cup 2026` : "Team — World Cup 2026" };
}

// Loader: seed the screen with the latest stored matches + standings; the Team
// screen finds this team, keeps them live by polling, and links each match to
// the match-detail route. Deep-linkable (/soccer/team/BRA).
export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const code = id.toUpperCase();
  if (!TEAMS[code as keyof typeof TEAMS]) notFound();
  const [matches, standings] = await Promise.all([liveMatchesResponse(), liveStandingsResponse()]);
  return <Team initialMatches={matches} initialStandings={standings} code={code} />;
}
