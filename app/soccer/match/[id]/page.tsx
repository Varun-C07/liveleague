import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Match } from "@/components/design/screens/Match";
import { liveMatchesResponse, liveStandingsResponse } from "@/lib/snapshot";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const res = await liveMatchesResponse();
  const m = res.matches.find((x) => String(x.n) === id);
  return {
    title: m ? `${m.home.name} vs ${m.away.name} — World Cup 2026` : "Match — World Cup 2026",
  };
}

// Loader: seed the client with the latest stored matches; the Match screen finds
// this match by id and keeps it live by polling /api/soccer. Deep-linkable.
export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [res, standings] = await Promise.all([liveMatchesResponse(), liveStandingsResponse()]);
  const m = res.matches.find((x) => String(x.n) === id);
  if (!m) notFound();
  return <Match initial={res} standings={standings} n={m.n} />;
}
