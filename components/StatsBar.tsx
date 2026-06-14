"use client";
import type { ApiMatch } from "@/lib/api-shape";

export function StatsBar({ matches, total }: { matches: ApiMatch[]; total: number }) {
  const played = matches.filter((m) => m.status === "ft").length;
  const liveN = matches.filter((m) => m.status === "live").length;
  let goals = 0;
  for (const m of matches) {
    if (m.status === "ft" || m.status === "live") {
      if (m.homeScore != null) goals += m.homeScore;
      if (m.awayScore != null) goals += m.awayScore;
    }
  }
  const pct = (played / total) * 100;

  return (
    <div className="flex gap-2.5 flex-[2_1_380px]">
      <Stat k="Matches Played">
        <div className="ff-cond font-bold text-[24px] mt-0.5">
          {played}<small className="text-[13px] text-dim font-semibold"> / {total}</small>
        </div>
        <div className="h-[5px] bg-line2 rounded mt-2.5 overflow-hidden">
          <i className="block h-full rounded transition-[width] duration-500" style={{ width: `${pct}%`, background: "linear-gradient(90deg,var(--green),var(--gold))" }} />
        </div>
      </Stat>
      <Stat k={liveN ? "Live Now" : "Goals Scored"}>
        <div className="ff-cond font-bold text-[24px] mt-0.5">
          {liveN ? (
            <>{liveN} <small className="text-[13px] text-dim font-semibold">match{liveN > 1 ? "es" : ""}</small></>
          ) : played ? (
            <>{goals} <small className="text-[13px] text-dim font-semibold">in {played}</small></>
          ) : "—"}
        </div>
      </Stat>
    </div>
  );
}

function Stat({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex-1 border border-line2 rounded-lg bg-panel2 px-3 py-3">
      <div className="ff-cond text-[11px] tracking-[0.16em] text-muted uppercase">{k}</div>
      {children}
    </div>
  );
}
