"use client";
import type { ApiMatch } from "@liveleagues/core/api-shape";
import { MatchRow } from "./MatchRow";

export function MatchList({
  matches,
  flashed,
  nextN,
}: {
  matches: ApiMatch[];
  flashed: Set<number>;
  nextN: number | null;
}) {
  return (
    <div>
      <div
        className="hidden sm:grid gap-3.5 px-3.5 pb-2 border-b border-line ff-cond uppercase tracking-[0.14em] text-[11px] text-dim"
        style={{ gridTemplateColumns: "46px 1.5fr 1.4fr 1.05fr auto" }}
      >
        <div className="text-center">No.</div>
        <div>Match</div>
        <div>Venue</div>
        <div>Kickoff</div>
        <div className="text-right">Score</div>
      </div>

      <div className="flex flex-col gap-1.5 mt-2.5">
        {matches.length ? (
          matches.map((m) => (
            <MatchRow key={m.n} m={m} flashed={flashed.has(m.n)} isNext={m.n === nextN && m.status !== "live"} />
          ))
        ) : (
          <div className="ff-mono text-[12px] text-dim text-center py-6">No matches match this filter.</div>
        )}
      </div>
    </div>
  );
}
