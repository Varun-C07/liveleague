"use client";
import type { Game } from "@liveleague/core/sports/types";
import { Podium } from "./Podium";
import { etParts, tzLabel } from "@/lib/time";
import { usePrefs } from "@/hooks/usePrefs";

const COLS = "48px 1.7fr 1.05fr 1fr 1.6fr";

export function RaceRow({ g, isNext }: { g: Game; isNext: boolean }) {
  const { tz } = usePrefs();
  if (g.extra.sport !== "f1") return null;
  const { round, circuit, sprint, podium } = g.extra;
  const done = g.status === "final";
  const live = g.status === "live";
  const et = etParts(g.utc, tz);

  const leftBar = live || isNext ? "var(--accent)" : done ? "var(--green2)" : "var(--dim)";
  const bg =
    live || isNext
      ? "linear-gradient(90deg, color-mix(in srgb, var(--accent) 7%, transparent), var(--panel) 42%)"
      : "var(--panel)";

  return (
    <div
      id={g.id}
      className="grid items-center gap-3 border border-line rounded-lg px-3.5 py-3 scroll-mt-20"
      style={{ gridTemplateColumns: COLS, borderLeft: `3px solid ${leftBar}`, background: bg }}
    >
      {/* round */}
      <div className="text-center">
        <div className="ff-cond font-bold text-[22px] leading-none">{round}</div>
        <small className="block text-[8.5px] text-dim tracking-wider font-semibold mt-0.5">RND</small>
      </div>

      {/* GP + circuit (+ mobile meta) */}
      <div className="min-w-0 col-span-1">
        <div className="flex items-center gap-2 mb-0.5">
          {live ? (
            <Badge color="var(--accent)" border>
              <span className="anim-blink">●</span> Live
            </Badge>
          ) : isNext ? (
            <Badge color="var(--accent)" border>
              Up Next
            </Badge>
          ) : done ? (
            <Badge color="var(--green)">Finished</Badge>
          ) : (
            <Badge color="var(--dim)">Upcoming</Badge>
          )}
          {sprint && (
            <span className="ff-cond text-[9px] font-bold tracking-wider text-gold border border-gold/40 rounded px-1.5 leading-snug">
              SPR
            </span>
          )}
        </div>
        <div className="ff-cond font-semibold text-[16px] uppercase truncate leading-tight">{g.home.name}</div>
        <div className="ff-mono text-[11px] text-muted truncate">{circuit}</div>
        <div className="ff-mono text-[10.5px] text-dim mt-1 sm:hidden">
          {g.city}, {g.country} · {et.time} {tzLabel(tz)}, {et.day}
        </div>
      </div>

      {/* location (desktop) */}
      <div className="hidden sm:block text-[13px] min-w-0">
        <div className="ff-cond font-semibold text-[14px] truncate">{g.city}</div>
        <div className="text-muted text-[11px] ff-mono mt-0.5">{g.country}</div>
      </div>

      {/* start ET (desktop) */}
      <div className="hidden sm:block ff-mono text-[13px]">
        {et.time}
        <small className="block text-muted text-[10.5px] mt-0.5">
          {et.day} {tzLabel(tz)}
        </small>
      </div>

      {/* podium */}
      <div className="min-w-0">
        <Podium podium={podium} />
      </div>
    </div>
  );
}

function Badge({ children, color, border }: { children: React.ReactNode; color: string; border?: boolean }) {
  return (
    <span
      className="ff-cond text-[9.5px] font-bold tracking-wider uppercase rounded px-1.5 leading-snug"
      style={{ color, border: border ? `1px solid ${color}` : "1px solid var(--line2)" }}
    >
      {children}
    </span>
  );
}
