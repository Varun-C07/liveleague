import type { Metadata } from "next";
import { SportBoard } from "@/components/shared/SportBoard";
import { nbaAdapter } from "@/lib/sports/nba";

export const metadata: Metadata = {
  title: "NBA — Live Scores",
  description: "Live NBA scores — quarter, clock and the night's slate.",
};

export default function NBAPage() {
  return (
    <SportBoard
      sport="nba"
      initial={nbaAdapter.snapshot()}
      eyebrow="National Basketball Association"
      title={
        <>
          NBA <span className="text-dim">{"// Live Scores"}</span>
        </>
      }
      sub="Live scores, quarter and game clock for tonight's slate — refreshed automatically while games are in play."
      emptyText="No NBA games on the board right now — check back on game day."
    />
  );
}
