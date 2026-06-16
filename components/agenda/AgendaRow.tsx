"use client";
import Link from "next/link";
import type { Game } from "@/lib/sports/types";
import { accentFor, isVersus, liveLabel, scoreText } from "@/lib/sports/format";
import { sportMeta } from "@/lib/sports/meta";
import { etParts } from "@/lib/time";
import { usePrefs } from "@/hooks/usePrefs";

export function AgendaRow({ g }: { g: Game }) {
  const { tz } = usePrefs();
  const meta = sportMeta(g.sport);
  const accent = accentFor(g.sport);
  const live = g.status === "live";
  const final = g.status === "final";
  const et = etParts(g.utc, tz);

  return (
    <Link
      href={`${meta?.basePath ?? "/"}#${g.id}`}
      className="flex items-center gap-3 border border-line rounded-lg bg-panel px-3 py-2.5 hover:border-line2 transition"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <span className="text-[15px] w-5 text-center flex-none" aria-hidden>
        {meta?.emoji}
      </span>
      <div className="w-[58px] flex-none ff-mono text-[11px]">
        {live ? (
          <span className="font-bold" style={{ color: accent }}>
            <span className="anim-blink">●</span> LIVE
          </span>
        ) : final ? (
          <span className="text-dim">FT</span>
        ) : (
          <span className="text-muted">{et.time}</span>
        )}
      </div>
      <div className="min-w-0 flex-1 ff-cond uppercase tracking-wide text-[14px] truncate">
        {isVersus(g) ? (
          <>
            {g.home.logo} {g.home.code} <span className="text-dim normal-case">v</span> {g.away.code} {g.away.logo}
          </>
        ) : (
          g.home.name
        )}
        <span className="ff-mono text-dim text-[10px] normal-case ml-2">{g.label}</span>
      </div>
      <div className="flex-none ff-mono text-[12px] text-right" style={{ color: live ? accent : "var(--muted)" }}>
        {live ? (
          <>
            {scoreText(g)} <span className="text-[10px]">{liveLabel(g)}</span>
          </>
        ) : final ? (
          scoreText(g)
        ) : (
          et.day
        )}
      </div>
    </Link>
  );
}
