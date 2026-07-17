"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Game, SportSummary } from "@liveleagues/core/sports/types";
import { isVersus, liveLabel, scoreText } from "@liveleagues/core/sports/format";
import { Countdown } from "./Countdown";
import { etParts } from "@/lib/time";
import { usePrefs } from "@/hooks/usePrefs";

export function LiveStatusCard({ s }: { s: SportSummary }) {
  const accent = `var(${s.accentVar})`;
  const live = s.liveCount > 0;
  const games = s.topGames.slice(0, 2);
  const r = s.reason ?? (s.source === "live" ? "live" : "fallback");
  const feedLabel = r === "live" ? "Live feed" : r === "empty" ? "No games" : r === "sample" ? "Sample" : "Saved data";
  const feedDot = r === "live" ? accent : r === "fallback" ? "var(--amber)" : "var(--dim)";

  return (
    <Link
      href={s.basePath}
      className="group relative block overflow-hidden rounded-xl border glass p-4 pl-5 transition hover:-translate-y-0.5"
      style={{
        borderColor: live ? accent : "var(--line)",
        boxShadow: live ? `0 0 30px -12px ${accent}` : undefined,
      }}
    >
      {/* left accent rail */}
      <span
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ background: accent, opacity: live ? 1 : 0.55 }}
      />

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[20px] leading-none" aria-hidden>
            {s.emoji}
          </span>
          <div className="min-w-0">
            <div className="ff-cond font-bold uppercase tracking-wide text-[17px] leading-none truncate">
              {s.name}
            </div>
            <div className="ff-mono text-[10.5px] text-dim mt-1 truncate">{s.blurb}</div>
          </div>
        </div>
        {live ? (
          <span
            className="flex-none ff-cond text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-1 anim-accent-pulse"
            style={{ color: accent, border: `1px solid ${accent}` }}
          >
            <span className="anim-blink">●</span> {s.liveCount} Live
          </span>
        ) : (
          <ArrowUpRight size={16} className="flex-none text-dim group-hover:text-text transition" />
        )}
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        {games.length ? (
          games.map((g) => <CardGame key={g.id} g={g} accent={accent} />)
        ) : (
          <div className="ff-mono text-[11px] text-dim py-2">No upcoming fixtures.</div>
        )}
      </div>

      <div className="mt-3 pt-2.5 border-t border-line flex items-center justify-between ff-mono text-[10px] text-dim">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: feedDot }} />
          {feedLabel}
        </span>
        <span>{s.total} {s.competitionLabel.toLowerCase()}s</span>
      </div>
    </Link>
  );
}

function CardGame({ g, accent }: { g: Game; accent: string }) {
  const { tz } = usePrefs();
  const live = g.status === "live";
  const final = g.status === "final";
  const et = etParts(g.utc, tz);

  // F1 (single-sided): show the GP/round name + status.
  if (!isVersus(g)) {
    return (
      <div className="flex items-center justify-between gap-2">
        <span className="ff-cond uppercase font-semibold text-[13px] truncate">{g.home.name}</span>
        <span className="ff-mono text-[11px] flex-none" style={{ color: live ? accent : "var(--muted)" }}>
          {live ? liveLabel(g) : final ? "Done" : et.day}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="ff-mono text-[12.5px] font-semibold truncate">
        {g.home.logo} {g.home.code} <span className="text-dim">v</span> {g.away.code} {g.away.logo}
      </span>
      <span className="ff-mono text-[12px] flex-none font-bold" style={{ color: live ? accent : "var(--muted)" }}>
        {live ? (
          <>
            {scoreText(g)} <span className="text-[10px] font-normal">{liveLabel(g)}</span>
          </>
        ) : final ? (
          scoreText(g)
        ) : (
          <span className="font-normal text-[11px]">
            <Countdown utc={g.utc} compact />
          </span>
        )}
      </span>
    </div>
  );
}
