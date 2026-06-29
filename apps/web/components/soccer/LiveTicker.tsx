"use client";
import type { ApiMatch } from "@liveleague/core/api-shape";
import { etParts } from "@/lib/time";
import { usePrefs } from "@/hooks/usePrefs";

// Horizontal strip: any live matches first, then the next few upcoming.
export function LiveTicker({ matches }: { matches: ApiMatch[] }) {
  const { tz } = usePrefs();
  const live = matches.filter((m) => m.status === "live");
  const upcoming = matches
    .filter((m) => m.status === "sched")
    .sort((a, b) => +new Date(a.utc) - +new Date(b.utc))
    .slice(0, 8);
  const items = [...live, ...upcoming];
  if (!items.length) return null;

  return (
    <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1" aria-label="Live and upcoming matches">
      {items.map((m) => {
        const isLive = m.status === "live";
        const et = etParts(m.utc, tz);
        return (
          <a
            key={m.n}
            href={`#match-${m.n}`}
            className="flex-none flex items-center gap-2 border rounded-md px-2.5 py-1.5 bg-panel2"
            style={{ borderColor: isLive ? "var(--live)" : "var(--line2)" }}
          >
            {isLive ? (
              <span className="ff-cond text-[9px] font-bold tracking-wider text-live uppercase">
                <span className="anim-blink">●</span> {m.minute || "Live"}
              </span>
            ) : (
              <span className="ff-cond text-[9px] font-bold tracking-wider text-dim uppercase">{m.stage}</span>
            )}
            <span className="ff-mono text-[12px] font-bold whitespace-nowrap">
              {m.home.flag} {m.home.code}
              <span className="text-dim mx-1">
                {isLive || m.status === "ft" ? `${m.homeScore ?? 0}-${m.awayScore ?? 0}` : "v"}
              </span>
              {m.away.code} {m.away.flag}
            </span>
            {!isLive && (
              <span className="ff-mono text-[10px] text-muted whitespace-nowrap">{m.approx ? et.day : et.time}</span>
            )}
          </a>
        );
      })}
    </div>
  );
}
