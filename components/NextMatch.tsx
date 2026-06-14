"use client";
import type { ApiMatch } from "@/lib/api-shape";
import { Countdown } from "./Countdown";
import { etParts, tzLabel } from "@/lib/time";
import { usePrefs } from "@/hooks/usePrefs";

export function NextMatch({ match }: { match: ApiMatch | null }) {
  const { tz } = usePrefs();
  if (!match) {
    return (
      <Panel tag="Next Match">
        <div className="ff-cond font-semibold text-[20px] uppercase mt-0.5">Tournament complete</div>
        <div className="text-muted text-[12px] ff-mono mt-1">Champions of the world</div>
      </Panel>
    );
  }
  const live = match.status === "live";
  const et = etParts(match.utc, tz);
  const hn = match.home.real ? `${match.home.flag} ${match.home.name}` : match.home.code;
  const an = match.away.real ? `${match.away.name} ${match.away.flag}` : match.away.code;

  return (
    <Panel tag={live ? "Live Now" : "Next Match"} live={live}>
      {live ? (
        <>
          <div className="ff-cond font-semibold text-[20px] uppercase mt-0.5 leading-tight">
            {hn} <b className="text-live">{match.homeScore ?? 0}–{match.awayScore ?? 0}</b> {an}
          </div>
          <div className="text-muted text-[12px] ff-mono mt-1">{match.stage} · {match.venue}, {match.city}</div>
          <div className="ff-mono font-bold text-[19px] mt-1.5 text-live">{match.minute || "LIVE"}</div>
        </>
      ) : (
        <>
          <div className="ff-cond font-semibold text-[20px] uppercase mt-0.5 leading-tight">
            {hn} <span className="text-dim">v</span> {an}
          </div>
          <div className="text-muted text-[12px] ff-mono mt-1">
            {match.stage} · {match.approx ? et.day : `${et.time} ${tzLabel(tz)}, ${et.day}`} · {match.city}
          </div>
          <div className="ff-mono font-bold text-[19px] mt-1.5">
            <Countdown utc={match.utc} />
          </div>
        </>
      )}
    </Panel>
  );
}

function Panel({ tag, live, children }: { tag: string; live?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex-1 min-w-[250px] border border-line2 rounded-lg bg-panel2 px-3.5 py-3">
      <div className="ff-cond text-[11px] tracking-[0.2em] text-muted uppercase flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${live ? "bg-live anim-rpulse" : "bg-green anim-pulse"}`} />
        {tag}
      </div>
      {children}
    </div>
  );
}
