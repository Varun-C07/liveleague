import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Player } from "@/components/design/screens/Player";
import { getPlayer } from "@/components/design/screens/player/playerData";
import { TEAMS } from "@/data/teams";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const profile = getPlayer(id);
  return { title: profile ? `${profile.player.name} — World Cup 2026` : "Player — World Cup 2026" };
}

// Loader: id is `${teamCode}-${number}` (e.g. BRA-7). Validate the team + player
// exist, then render. Deep-linkable; the Player screen reads bio/stats/analysis
// from the player seam.
export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const code = id.split("-")[0];
  if (!TEAMS[code as keyof typeof TEAMS] || !getPlayer(id)) notFound();
  return <Player id={id} code={code} />;
}
