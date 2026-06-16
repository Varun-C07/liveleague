"use client";
import { useMemo, useState } from "react";
import type { Game, LiveBundle, SportId } from "@/lib/sports/types";
import { useLiveBundle } from "@/hooks/useLive";
import { useScoreFlash } from "@/hooks/useScoreFlash";
import { useFavorites } from "@/hooks/useFavorites";
import { SportHeader } from "./SportHeader";
import { GameTicker } from "./GameTicker";
import { GameRow } from "./GameRow";
import { StandingsStrip } from "./StandingsStrip";
import { FilterBar, type FilterDef } from "./FilterBar";

type FKey = "all" | "live" | "today" | "done" | "up" | "favs";
const DEFS: FilterDef<FKey>[] = [
  { key: "all", label: "All" },
  { key: "live", label: "● Live", live: true },
  { key: "today", label: "Today" },
  { key: "favs", label: "★ My Teams" },
  { key: "done", label: "Completed" },
  { key: "up", label: "Upcoming" },
];

function etDateKey(utc: string): string {
  return new Date(utc).toLocaleDateString("en-US", { timeZone: "America/New_York" });
}

// Sort: live first, then soonest upcoming, then most-recent finals.
function sortGames(a: Game, b: Game): number {
  const rank = (g: Game) => (g.status === "live" ? 0 : g.status === "sched" ? 1 : 2);
  const ra = rank(a);
  const rb = rank(b);
  if (ra !== rb) return ra - rb;
  const ta = +new Date(a.utc);
  const tb = +new Date(b.utc);
  return ra === 2 ? tb - ta : ta - tb;
}

// Generic board for two-team sports (NBA, MLB, cricket).
export function SportBoard({
  sport,
  initial,
  eyebrow,
  title,
  sub,
  emptyText = "No games on the schedule right now.",
}: {
  sport: SportId;
  initial: LiveBundle;
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  sub?: React.ReactNode;
  emptyText?: string;
}) {
  const q = useLiveBundle(sport, initial);
  const data = q.data;
  const games = data.games;
  const flashed = useScoreFlash(games);
  const fav = useFavorites();
  const [filter, setFilter] = useState<FKey>("all");
  const todayKey = etDateKey(new Date().toISOString());
  const isFavGame = (g: Game) => fav.has(sport, g.home.code) || fav.has(sport, g.away.code);

  const counts = useMemo<Record<FKey, number>>(
    () => ({
      all: games.length,
      live: games.filter((g) => g.status === "live").length,
      today: games.filter((g) => etDateKey(g.utc) === todayKey).length,
      favs: games.filter(isFavGame).length,
      done: games.filter((g) => g.status === "final").length,
      up: games.filter((g) => g.status === "sched").length,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [games, todayKey, fav],
  );

  const list = useMemo(() => {
    const pred = (g: Game): boolean => {
      switch (filter) {
        case "live":
          return g.status === "live";
        case "today":
          return etDateKey(g.utc) === todayKey;
        case "done":
          return g.status === "final";
        case "up":
          return g.status === "sched";
        case "favs":
          return isFavGame(g);
        default:
          return true;
      }
    };
    return games.filter(pred).sort(sortGames);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [games, filter, todayKey, fav]);

  return (
    <div className="max-w-[1180px] mx-auto px-3.5 pt-5 pb-16">
      <SportHeader
        eyebrow={eyebrow}
        title={title}
        sub={sub}
        source={data.source}
        reason={data.reason}
        syncedAt={data.syncedAt}
        isFetching={q.isFetching}
        onRefresh={() => q.refetch()}
      >
        <div className="flex flex-wrap gap-2.5 mt-5">
          <Stat k="Live Now">
            <div className="ff-cond font-bold text-[24px] mt-0.5">
              {counts.live ? (
                <span style={{ color: "var(--accent)" }}>
                  <span className="anim-blink">●</span> {counts.live}
                </span>
              ) : (
                "—"
              )}
            </div>
          </Stat>
          <Stat k="Games Today">
            <div className="ff-cond font-bold text-[24px] mt-0.5">
              {counts.today}
              <small className="text-[13px] text-dim font-semibold"> scheduled</small>
            </div>
          </Stat>
          <Stat k="On The Board">
            <div className="ff-cond font-bold text-[24px] mt-0.5">
              {counts.all}
              <small className="text-[13px] text-dim font-semibold"> games</small>
            </div>
          </Stat>
        </div>

        <GameTicker games={games} hrefBase="" />
        <StandingsStrip rows={data.standings} title={data.standingsTitle} />
      </SportHeader>

      <FilterBar defs={DEFS} value={filter} counts={counts} onChange={setFilter} />

      <div className="flex flex-col gap-1.5">
        {list.length ? (
          list.map((g) => <GameRow key={g.id} g={g} flashed={flashed.has(g.id)} />)
        ) : (
          <div className="ff-mono text-[12px] text-dim text-center py-10 border border-line rounded-lg bg-panel">
            {games.length ? "No games match this filter." : emptyText}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex-1 min-w-[140px] border border-line2 rounded-xl bg-panel2 px-3 py-3">
      <div className="ff-cond text-[11px] tracking-[0.16em] text-muted uppercase">{k}</div>
      {children}
    </div>
  );
}
