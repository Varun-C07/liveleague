"use client";
import type { Competitor, Game } from "@/lib/sports/types";
import { liveLabel } from "@/lib/sports/format";
import { etParts, tzLabel } from "@/lib/time";
import { usePrefs } from "@/hooks/usePrefs";
import { FavoritesStar } from "./FavoritesStar";

// Generic row for two-team sports (NBA, MLB, cricket). Soccer & F1 keep bespoke
// rows; everything else shares this.
export function GameRow({ g, flashed }: { g: Game; flashed?: boolean }) {
  const { tz } = usePrefs();
  const live = g.status === "live";
  const final = g.status === "final";
  const et = etParts(g.utc, tz);
  const hs = g.home.score;
  const as = g.away.score;
  const shown = hs != null && as != null;
  const hw = shown && (hs as number) > (as as number);
  const aw = shown && (as as number) > (hs as number);

  const leftBar = live ? "var(--accent)" : final ? "var(--green2)" : "var(--dim)";
  const bg = live
    ? "linear-gradient(90deg, color-mix(in srgb, var(--accent) 7%, transparent), var(--panel) 45%)"
    : "var(--panel)";

  return (
    <div
      id={g.id}
      className={`grid items-center gap-3 border border-line rounded-lg px-3.5 py-3 scroll-mt-20 ${flashed ? "score-flash" : ""}`}
      style={{ gridTemplateColumns: "1.7fr 1.1fr auto", borderLeft: `3px solid ${leftBar}`, background: bg }}
    >
      {/* status + teams */}
      <div className="min-w-0 flex flex-col gap-1.5">
        <div
          className="ff-cond text-[9.5px] font-bold tracking-wider uppercase truncate"
          style={{ color: live ? "var(--accent)" : "var(--dim)" }}
        >
          {live ? (
            <>
              <span className="anim-blink">●</span> {liveLabel(g)}
            </>
          ) : (
            g.label || (final ? "Final" : et.day)
          )}
        </div>
        <TeamLine c={g.home} score={shown ? hs : undefined} win={hw} lose={aw} />
        <TeamLine c={g.away} score={shown ? as : undefined} win={aw} lose={hw} />
      </div>

      {/* venue (desktop) */}
      <div className="hidden sm:block text-[12px] min-w-0">
        <div className="ff-cond font-semibold text-[13px] truncate">{g.venue || "—"}</div>
        <div className="text-muted text-[11px] ff-mono mt-0.5 truncate">
          {[g.city, g.country].filter(Boolean).join(", ")}
        </div>
      </div>

      {/* score / time + favorite */}
      <div className="flex items-center gap-1 justify-self-end">
        <div className="text-center ff-mono min-w-[60px]">
          {live || final ? (
            <>
              <div className={`ff-cond font-bold text-[20px] tracking-wider ${flashed ? "score-pop" : ""}`}>
                {hs ?? 0}–{as ?? 0}
              </div>
              <div className="text-[10px] uppercase tracking-wide" style={{ color: live ? "var(--accent)" : "var(--dim)" }}>
                {live ? liveLabel(g) : "Final"}
              </div>
            </>
          ) : (
            <div className="ff-cond font-semibold text-[15px]">
              {g.approx ? "TBD" : et.time}
              <small className="block ff-mono text-[10px] text-muted font-normal">
                {et.day} {tzLabel(tz)}
              </small>
            </div>
          )}
        </div>
        <FavoritesStar sport={g.sport} codes={[g.home.code, g.away.code]} />
      </div>
    </div>
  );
}

function TeamLine({ c, score, win, lose }: { c: Competitor; score?: number | null; win?: boolean; lose?: boolean }) {
  return (
    <div className={`flex items-center gap-2 min-w-0 ${lose ? "opacity-60" : ""}`}>
      <span className="w-[3px] h-4 flex-none rounded-sm" style={{ background: c.color }} />
      {c.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={c.logoUrl} alt="" width={18} height={18} className="flex-none object-contain" loading="lazy" />
      ) : c.logo ? (
        <span className="flex-none w-[18px] text-center text-[14px]">{c.logo}</span>
      ) : null}
      <span className={`ff-cond font-semibold uppercase tracking-wide truncate text-[15px] ${win ? "text-white" : ""}`}>
        {c.name}
        <span className="ff-mono text-dim font-normal normal-case ml-1.5 text-[10px]">{c.code}</span>
      </span>
      {score != null && (
        <span
          className={`ml-auto ff-mono font-bold flex-none pl-2 text-[16px] ${win ? "" : "text-muted"}`}
          style={win ? { color: "var(--accent)" } : undefined}
        >
          {score}
        </span>
      )}
    </div>
  );
}
