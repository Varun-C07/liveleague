"use client";
import { useMemo, useState } from "react";
import type { Game, LiveBundle } from "@/lib/sports/types";
import { useLiveBundle } from "@/hooks/useLive";
import { SportHeader } from "@/components/shared/SportHeader";
import { StandingsStrip } from "@/components/shared/StandingsStrip";
import { Countdown } from "@/components/shared/Countdown";
import { FilterBar, type FilterDef } from "@/components/shared/FilterBar";
import { RaceRow } from "./RaceRow";
import { etParts, tzLabel } from "@/lib/time";
import { usePrefs } from "@/hooks/usePrefs";

type FKey = "all" | "done" | "up" | "sprint";
const DEFS: FilterDef<FKey>[] = [
  { key: "all", label: "All" },
  { key: "done", label: "Completed" },
  { key: "up", label: "Upcoming" },
  { key: "sprint", label: "Sprint" },
];

function nextRace(games: Game[]): Game | null {
  const live = games.find((g) => g.status === "live");
  if (live) return live;
  const now = Date.now();
  const upcoming = games
    .filter((g) => g.status !== "final")
    .sort((a, b) => +new Date(a.utc) - +new Date(b.utc));
  return upcoming.find((g) => +new Date(g.utc) > now) || upcoming[0] || null;
}

export function F1Board({ initial }: { initial: LiveBundle }) {
  const q = useLiveBundle("f1", initial);
  const { tz } = usePrefs();
  const data = q.data;
  const games = data.games;
  const [filter, setFilter] = useState<FKey>("all");

  const next = useMemo(() => nextRace(games), [games]);
  const done = games.filter((g) => g.status === "final");

  const mostWins = useMemo(() => {
    const wins: Record<string, number> = {};
    for (const g of done) {
      if (g.extra.sport === "f1" && g.extra.podium) {
        const w = g.extra.podium[0].code;
        wins[w] = (wins[w] || 0) + 1;
      }
    }
    let top = "—";
    let mx = 0;
    for (const k in wins) {
      if (wins[k] > mx) {
        mx = wins[k];
        top = k;
      }
    }
    return { top, mx };
  }, [done]);

  const counts: Record<FKey, number> = {
    all: games.length,
    done: done.length,
    up: games.length - done.length,
    sprint: games.filter((g) => g.extra.sport === "f1" && g.extra.sprint).length,
  };

  const list = useMemo(() => {
    return games.filter((g) => {
      if (g.extra.sport !== "f1") return false;
      if (filter === "done") return g.status === "final";
      if (filter === "up") return g.status !== "final";
      if (filter === "sprint") return g.extra.sprint;
      return true;
    });
  }, [games, filter]);

  const nextEt = next ? etParts(next.utc, tz) : null;

  return (
    <div className="max-w-[1180px] mx-auto px-3.5 pt-5 pb-16">
      <SportHeader
        eyebrow="FIA Formula One World Championship"
        title={
          <>
            2026 Season <span className="text-dim">{"// Live Board"}</span>
          </>
        }
        sub="Every round of the 22-race calendar with race day, location and start time. Podiums and the championship pull live from the Jolpica F1 API and refresh after each Grand Prix."
        source={data.source}
        reason={data.reason}
        syncedAt={data.syncedAt}
        isFetching={q.isFetching}
        onRefresh={() => q.refetch()}
      >
        <div className="flex flex-wrap gap-2.5 mt-5">
          {/* Next GP */}
          <div className="flex-1 min-w-[250px] border border-line2 rounded-xl bg-panel2 px-3.5 py-3">
            <div className="ff-cond text-[11px] tracking-[0.2em] text-muted uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full anim-accent-pulse" style={{ background: "var(--accent)" }} />
              {next?.status === "live" ? "Race In Progress" : "Next Grand Prix"}
            </div>
            {next ? (
              <>
                <div className="ff-cond font-semibold text-[20px] uppercase mt-0.5 leading-tight">{next.home.name}</div>
                <div className="text-muted text-[12px] ff-mono mt-1">
                  {next.city} · {nextEt?.time} {tzLabel(tz)}, {nextEt?.day}
                </div>
                <div className="ff-mono font-bold text-[19px] mt-1.5">
                  <Countdown utc={next.utc} live="LIGHTS OUT" />
                </div>
              </>
            ) : (
              <>
                <div className="ff-cond font-semibold text-[20px] uppercase mt-0.5">Season complete</div>
                <div className="text-muted text-[12px] ff-mono mt-1">See you in 2027</div>
              </>
            )}
          </div>

          {/* stats */}
          <div className="flex gap-2.5 flex-[2_1_380px]">
            <Stat k="Rounds Run">
              <div className="ff-cond font-bold text-[24px] mt-0.5">
                {done.length}
                <small className="text-[13px] text-dim font-semibold"> / {games.length}</small>
              </div>
              <div className="h-[5px] bg-line2 rounded mt-2.5 overflow-hidden">
                <i
                  className="block h-full rounded transition-[width] duration-500"
                  style={{
                    width: `${(done.length / Math.max(games.length, 1)) * 100}%`,
                    background: "linear-gradient(90deg,var(--accent),#ff7a3c)",
                  }}
                />
              </div>
            </Stat>
            <Stat k="Most Wins">
              <div className="ff-cond font-bold text-[24px] mt-0.5">
                {mostWins.mx ? (
                  <>
                    {mostWins.top} <small className="text-[13px] text-dim font-semibold">{mostWins.mx} wins</small>
                  </>
                ) : (
                  "—"
                )}
              </div>
            </Stat>
          </div>
        </div>

        <StandingsStrip rows={data.standings} title={data.standingsTitle || "Drivers' Championship"} />
      </SportHeader>

      <FilterBar defs={DEFS} value={filter} counts={counts} onChange={setFilter} />

      {/* table head (desktop) */}
      <div
        className="hidden sm:grid gap-3 px-3.5 pb-2 border-b border-line ff-cond uppercase tracking-[0.14em] text-[11px] text-dim"
        style={{ gridTemplateColumns: "48px 1.7fr 1.05fr 1fr 1.6fr" }}
      >
        <div className="text-center">Rnd</div>
        <div>Grand Prix</div>
        <div>Location</div>
        <div>Start</div>
        <div>Podium · P1 P2 P3</div>
      </div>

      <div className="flex flex-col gap-1.5 mt-2.5">
        {list.length ? (
          list.map((g) => <RaceRow key={g.id} g={g} isNext={!!next && g.id === next.id && g.status !== "final"} />)
        ) : (
          <div className="ff-mono text-[12px] text-dim text-center py-6">No rounds match this filter.</div>
        )}
      </div>

      <footer className="mt-6 text-dim text-[11.5px] ff-mono leading-relaxed border-t border-line pt-3.5">
        <div>
          <b className="text-muted">Live data</b> from the Jolpica F1 API (api.jolpi.ca), proxied & cached
          server-side — podiums & standings update after each round.
        </div>
        <div>
          <b className="text-muted">Start times</b> shown in {tzLabel(tz)} (tap the globe to switch), computed
          from each race start in UTC so EST/EDT is handled automatically.
        </div>
      </footer>
    </div>
  );
}

function Stat({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex-1 border border-line2 rounded-xl bg-panel2 px-3 py-3">
      <div className="ff-cond text-[11px] tracking-[0.16em] text-muted uppercase">{k}</div>
      {children}
    </div>
  );
}
