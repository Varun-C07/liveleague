"use client";
import type { StandingsResponse } from "@liveleagues/core/api-shape";
import { useFavorites } from "@/hooks/useFavorites";
import { Star } from "lucide-react";

export function GroupStandings({ data }: { data: StandingsResponse }) {
  const fav = useFavorites();
  const groups = Object.keys(data.groups);
  const thirds = new Set(data.bestThirds);

  return (
    <div className="mt-3.5 border border-line rounded-[9px] bg-panel px-3.5 py-3" id="standings">
      <div className="ff-cond uppercase tracking-[0.16em] text-[11px] text-dim flex items-center gap-2 mb-2.5">
        Group Standings <b className="text-text font-semibold">· top 2 + 8 best 3rd-place advance</b>
      </div>
      <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(225px,1fr))" }}>
        {groups.map((g) => (
          <div key={g} className="border border-line2 rounded-lg bg-panel2 px-2.5 py-2.5">
            <div className="ff-cond font-bold text-[13px] tracking-wider uppercase text-muted mb-1.5 flex justify-between items-baseline">
              <span>Group {g}</span>
              <small className="text-dim font-semibold text-[9.5px] tracking-tight">P W-D-L GF:GA Pts</small>
            </div>
            {data.groups[g].map((t, i) => {
              const q = i < 2;
              const third = i === 2 && thirds.has(t.code);
              const isFav = fav.has("soccer", t.code);
              return (
                <div
                  key={t.code}
                  className="grid items-center gap-1.5 py-[3px] text-[12.5px]"
                  style={{ gridTemplateColumns: "13px 3px 1fr auto auto" }}
                >
                  <span className={`ff-cond font-bold text-[12px] text-center ${q ? "text-green" : third ? "text-gold" : "text-dim"}`}>{i + 1}</span>
                  <span className="w-[3px] h-[15px] rounded-sm" style={{ background: t.color }} />
                  <span className={`ff-mono font-bold text-[12px] truncate flex items-center gap-1 ${q || third ? "text-text" : "text-muted"}`}>
                    {t.flag} {t.code}
                    {isFav && <Star size={9} className="text-gold fill-gold flex-none" />}
                  </span>
                  <span className="ff-mono text-[10px] text-muted whitespace-nowrap">{t.P}·{t.W}-{t.D}-{t.L}·{t.GF}:{t.GA}</span>
                  <span className={`ff-mono font-bold text-[12.5px] min-w-[14px] text-right ${q ? "text-green" : ""}`}>{t.Pts}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
