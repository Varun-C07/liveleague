"use client";
import type { ApiMatch } from "@liveleague/core/api-shape";
import { TeamBadge } from "./TeamBadge";
import { FavoritesStar } from "@/components/shared/FavoritesStar";
import { ShareMenu } from "./ShareMenu";
import { etParts, tzLabel } from "@/lib/time";
import { usePrefs } from "@/hooks/usePrefs";

export function MatchRow({ m, flashed, isNext }: { m: ApiMatch; flashed: boolean; isNext: boolean }) {
  const { tz } = usePrefs();
  const ft = m.status === "ft";
  const live = m.status === "live";
  const et = etParts(m.utc, tz);
  const shown = m.homeScore != null && m.awayScore != null;
  const hw = shown && (m.homeScore ?? 0) > (m.awayScore ?? 0);
  const aw = shown && (m.awayScore ?? 0) > (m.homeScore ?? 0);

  const leftBar = live ? "var(--live)" : isNext ? "var(--gold)" : ft ? "var(--green2)" : "var(--dim)";
  const bg = live
    ? "linear-gradient(90deg,rgba(255,59,59,0.07),var(--panel) 45%)"
    : isNext
      ? "linear-gradient(90deg,rgba(240,198,74,0.06),var(--panel) 40%)"
      : undefined;

  return (
    <div
      id={`match-${m.n}`}
      className={`grid items-center gap-3.5 border border-line rounded-lg px-3.5 py-3 transition scroll-mt-24 ${flashed ? "goal-flash" : ""}`}
      style={{
        gridTemplateColumns: "46px 1.5fr 1.4fr 1.05fr auto",
        borderLeft: `3px solid ${leftBar}`,
        background: bg || "var(--panel)",
      }}
    >
      {/* number / group */}
      <div className="ff-cond font-bold text-[22px] text-center leading-none hidden sm:block">
        {m.n}
        <small className="block text-[9px] tracking-wide text-dim font-semibold mt-0.5">
          {m.grp != null ? "GRP " + m.grp : "KO"}
        </small>
      </div>

      {/* match (stage + teams) */}
      <div className="flex flex-col gap-1 min-w-0 col-span-2 sm:col-span-1">
        <StagePill m={m} />
        <TeamBadge team={m.home} score={shown ? m.homeScore : undefined} win={hw} lose={aw} />
        <TeamBadge team={m.away} score={shown ? m.awayScore : undefined} win={aw} lose={hw} />
      </div>

      {/* venue (desktop) */}
      <div className="hidden sm:block text-[13px] min-w-0">
        <div className="ff-cond font-semibold text-[14px] truncate">{m.venue}</div>
        <div className="text-muted text-[11px] ff-mono mt-0.5">{m.city}{m.country ? `, ${m.country}` : ""}</div>
      </div>

      {/* kickoff (desktop) */}
      <div className="hidden sm:block ff-mono text-[13px]">
        {m.approx ? "TBD" : et.time}
        <small className="block text-muted text-[10.5px] mt-0.5">{et.day} {tzLabel(tz)}</small>
      </div>

      {/* score / actions */}
      <div className="flex items-center gap-1.5 justify-self-end">
        <div className="text-center ff-mono min-w-[58px]">
          {live ? (
            <>
              <div className={`ff-cond font-bold text-[20px] tracking-wider ${flashed ? "score-pop" : ""}`}>{m.homeScore ?? 0}–{m.awayScore ?? 0}</div>
              <div className="text-[11px] tracking-wide text-live font-bold uppercase">
                <span className="anim-blink">●</span> {m.minute || "Live"}
              </div>
            </>
          ) : ft ? (
            <>
              <div className="ff-cond font-bold text-[20px] tracking-wider">{m.homeScore ?? "–"}–{m.awayScore ?? "–"}</div>
              <div className="text-[10px] tracking-wide text-dim uppercase">Full Time</div>
            </>
          ) : (
            <div className="ff-cond font-semibold text-[15px]">
              {m.approx ? "TBD" : et.time}
              <small className="block ff-mono text-[10px] text-muted font-normal sm:hidden">{et.day} {tzLabel(tz)}</small>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-0.5">
          <FavoritesStar sport="soccer" codes={[m.home.code, m.away.code]} />
          <ShareMenu match={m} />
        </div>
      </div>
    </div>
  );
}

function StagePill({ m }: { m: ApiMatch }) {
  const ko = m.grp == null;
  return (
    <div className="flex items-center gap-2">
      <span className={`ff-cond text-[9.5px] font-bold tracking-wider uppercase border border-line2 rounded px-1.5 py-px leading-snug ${ko ? "text-gold" : "text-green"}`}>
        {m.stage}
      </span>
      <span className="ff-cond text-[9.5px] font-bold tracking-wide text-dim uppercase sm:hidden">#{m.n}</span>
    </div>
  );
}
