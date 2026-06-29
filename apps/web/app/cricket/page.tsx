import type { Metadata } from "next";
import { SportBoard } from "@/components/shared/SportBoard";
import { cricketAdapter } from "@/lib/sports/cricket";

export const metadata: Metadata = {
  title: "Cricket — Live Scores",
  description: "International & league cricket — innings, overs and results.",
};

export default function CricketPage() {
  return (
    <SportBoard
      sport="cricket"
      initial={cricketAdapter.snapshot()}
      eyebrow="International Cricket"
      title={
        <>
          Cricket <span className="text-dim">{"// Live Scores"}</span>
        </>
      }
      sub="Internationals and league fixtures — innings, overs and results. Cricket runs on a verified fixture set while a live feed is wired in."
      emptyText="No cricket fixtures on the board right now."
    />
  );
}
