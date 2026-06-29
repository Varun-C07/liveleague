"use client";
import Link from "next/link";
import type { Game } from "@/lib/sports/types";
import { accentFor, isVersus, liveLabel, scoreText, topGames } from "@/lib/sports/format";
import { sportMeta } from "@/lib/sports/meta";
import { etParts } from "@/lib/time";
import { usePrefs } from "@/hooks/usePrefs";

// Generic horizontal ticker over any sport's games. On the home page it shows a
// cross-sport mix (showSport pills + links out to each sport page).
export function GameTicker({
  games,
  limit = 14,
  showSport = false,
  hrefBase,
}: {
  games: Game[];
  limit?: number;
  showSport?: boolean;
  hrefBase?: string; // when set, items deep-link to `${hrefBase}#<id>`
}) {
  const { tz } = usePrefs();
  const items = topGames(games, limit);
  if (!items.length) return null;

  return (
    <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1" aria-label="Live and upcoming">
      {items.map((g) => {
        const isLive = g.status === "live";
        const meta = sportMeta(g.sport);
        const accent = accentFor(g.sport);
        const href = showSport && meta ? meta.basePath : hrefBase != null ? `${hrefBase}#${g.id}` : undefined;
        const et = etParts(g.utc, tz);

        const inner = (
          <>
            {showSport && (
              <span className="text-[12px] leading-none" aria-hidden>
                {meta?.emoji}
              </span>
            )}
            {isLive ? (
              <span
                className="ff-cond text-[9px] font-bold tracking-wider uppercase"
                style={{ color: accent }}
              >
                <span className="anim-blink">●</span> {liveLabel(g)}
              </span>
            ) : (
              <span className="ff-cond text-[9px] font-bold tracking-wider text-dim uppercase truncate max-w-[90px]">
                {g.label}
              </span>
            )}

            {isVersus(g) ? (
              <span className="ff-mono text-[12px] font-bold whitespace-nowrap">
                {g.home.logo} {g.home.code}
                <span className="text-dim mx-1">{scoreText(g)}</span>
                {g.away.code} {g.away.logo}
              </span>
            ) : (
              <span className="ff-mono text-[12px] font-bold whitespace-nowrap truncate max-w-[150px]">
                {g.home.name}
              </span>
            )}

            {!isLive && (
              <span className="ff-mono text-[10px] text-muted whitespace-nowrap">
                {g.approx ? et.day : et.time}
              </span>
            )}
          </>
        );

        const cls =
          "flex-none flex items-center gap-2 border rounded-md px-2.5 py-1.5 bg-panel2 transition hover:border-line2";
        const style = { borderColor: isLive ? accent : "var(--line2)" };

        return href ? (
          <Link key={g.id} href={href} className={cls} style={style}>
            {inner}
          </Link>
        ) : (
          <div key={g.id} className={cls} style={style}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
