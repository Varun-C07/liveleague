"use client";
import Link from "next/link";
import type { StandingRow } from "@/lib/sports/types";

// Horizontal championship-style standings (F1 drivers, etc.) — a scrolling
// strip of chips. Each row's first metric is shown inline. When `hrefBase` is
// set, each chip links to `${hrefBase}/${code}` (e.g. a driver profile).
export function StandingsStrip({
  rows,
  title,
  limit = 10,
  hrefBase,
}: {
  rows?: StandingRow[];
  title?: string;
  limit?: number;
  hrefBase?: string;
}) {
  if (!rows || !rows.length) return null;
  return (
    <div className="mt-3.5 border border-line rounded-[9px] bg-panel px-3.5 py-3">
      <div className="ff-cond uppercase tracking-[0.16em] text-[11px] text-dim flex items-center gap-2 mb-2.5">
        {title || "Standings"} <b className="text-text font-semibold">· top {Math.min(limit, rows.length)}</b>
        {hrefBase && <span className="text-dim font-normal normal-case">· tap a driver</span>}
      </div>
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {rows.slice(0, limit).map((d, i) => {
          const inner = (
            <>
              <span
                className="ff-cond font-bold text-[15px] min-w-[16px] text-right"
                style={{ color: i === 0 ? "var(--gold)" : "var(--dim)" }}
              >
                {d.rank}
              </span>
              <span className="w-[3px] h-[20px] rounded-sm flex-none" style={{ background: d.color }} />
              <span className="ff-mono font-bold text-[13px] whitespace-nowrap">{d.code}</span>
              {d.metrics[0] && (
                <span className="ff-mono text-[11px] text-muted whitespace-nowrap">
                  <b className="text-text font-bold">{d.metrics[0].value}</b>{" "}
                  {String(d.metrics[0].label).toLowerCase()}
                </span>
              )}
            </>
          );
          const cls = "flex-none flex items-center gap-2 border border-line2 rounded-md bg-panel2 px-2.5 py-1.5";
          return hrefBase ? (
            <Link key={d.code + i} href={`${hrefBase}/${d.code}`} className={`${cls} hover:border-text transition`}>
              {inner}
            </Link>
          ) : (
            <div key={d.code + i} className={cls}>
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
