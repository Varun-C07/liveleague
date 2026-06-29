import type { Metadata } from "next";
import { SportBoard } from "@/components/shared/SportBoard";
import { baseballAdapter } from "@/lib/sports/baseball";

export const metadata: Metadata = {
  title: "MLB — Live Scores",
  description: "Live MLB scores — inning, half and the day's games.",
};

export default function BaseballPage() {
  return (
    <SportBoard
      sport="baseball"
      initial={baseballAdapter.snapshot()}
      eyebrow="Major League Baseball"
      title={
        <>
          MLB <span className="text-dim">{"// Live Scores"}</span>
        </>
      }
      sub="Live scores, inning and base state for today's MLB games — refreshed automatically while games are live."
      emptyText="No MLB games on the board right now — check back on game day."
    />
  );
}
