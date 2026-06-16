"use client";
import { useEffect, useMemo, useState } from "react";
import { Volume2, VolumeX, Globe } from "lucide-react";
import type { MatchesResponse, StandingsResponse, ApiMatch } from "@/lib/api-shape";
import { useMatches, useStandings } from "@/hooks/useMatches";
import { useGoalFlash } from "@/hooks/useGoalFlash";
import { useFavorites } from "@/hooks/useFavorites";
import { usePrefs } from "@/hooks/usePrefs";
import { SyncPill } from "@/components/shared/SyncPill";
import { NextMatch } from "./NextMatch";
import { StatsBar } from "./StatsBar";
import { GroupStandings } from "./GroupStandings";
import { LiveTicker } from "./LiveTicker";
import { Filters, type FilterKey } from "./Filters";
import { MatchList } from "./MatchList";
import { tzLabel, type TzMode } from "@/lib/time";

const HASH_TO_FILTER: Record<string, FilterKey> = {
  today: "today", live: "live", favs: "favs", completed: "done",
  upcoming: "up", group: "group", knockouts: "ko", all: "all",
};

function etDateKey(utc: string): string {
  return new Date(utc).toLocaleDateString("en-US", { timeZone: "America/New_York" });
}

export function Board({
  initialMatches,
  initialStandings,
}: {
  initialMatches: MatchesResponse;
  initialStandings: StandingsResponse;
}) {
  const m = useMatches(initialMatches);
  const s = useStandings(initialStandings);
  const fav = useFavorites();
  const { tz, setTz, sound, setSound } = usePrefs();
  const [filter, setFilter] = useState<FilterKey>("all");

  const data = m.data;
  const matches = data.matches;
  const { flashed, announce } = useGoalFlash(matches);

  // deep-link: hash -> filter (on mount + hashchange)
  useEffect(() => {
    const apply = () => {
      const h = location.hash.replace(/^#/, "").split("-")[0];
      if (HASH_TO_FILTER[h]) setFilter(HASH_TO_FILTER[h]);
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  const next = useMemo(() => nextMatch(matches), [matches]);
  const todayKey = etDateKey(new Date().toISOString());

  const predicate = useMemo(() => {
    return (x: ApiMatch): boolean => {
      switch (filter) {
        case "today": return etDateKey(x.utc) === todayKey;
        case "live": return x.status === "live";
        case "favs": return (x.home.real && fav.has("soccer", x.home.code)) || (x.away.real && fav.has("soccer", x.away.code));
        case "done": return x.status === "ft";
        case "up": return x.status === "sched";
        case "group": return x.grp != null;
        case "ko": return x.grp == null;
        default: return true;
      }
    };
  }, [filter, fav, todayKey]);

  const list = useMemo(() => {
    const pinned = filter === "all" || filter === "today";
    return matches.filter(predicate).sort((a, b) => {
      const liveA = a.status === "live" ? 0 : 1;
      const liveB = b.status === "live" ? 0 : 1;
      if (liveA !== liveB) return liveA - liveB;
      if (pinned) {
        const favA = isFav(a, fav) ? 0 : 1;
        const favB = isFav(b, fav) ? 0 : 1;
        if (favA !== favB) return favA - favB;
      }
      return a.n - b.n;
    });
  }, [matches, predicate, filter, fav]);

  const counts = useMemo<Record<FilterKey, number>>(() => ({
    all: matches.length,
    today: matches.filter((x) => etDateKey(x.utc) === todayKey).length,
    live: matches.filter((x) => x.status === "live").length,
    favs: matches.filter((x) => isFav(x, fav)).length,
    done: matches.filter((x) => x.status === "ft").length,
    up: matches.filter((x) => x.status === "sched").length,
    group: matches.filter((x) => x.grp != null).length,
    ko: matches.filter((x) => x.grp == null).length,
  }), [matches, fav, todayKey]);

  function pick(k: FilterKey) {
    setFilter(k);
    history.replaceState(null, "", k === "all" ? location.pathname : `#${invHash(k)}`);
  }

  return (
    <div className="max-w-[1180px] mx-auto px-3.5 pt-4 pb-16">
      <header className="border border-line rounded-[10px] relative overflow-hidden p-4 pb-4"
        style={{ background: "linear-gradient(180deg,var(--panel),var(--bg2))" }}>
        <span className="absolute left-0 top-0 bottom-0 w-1 bg-green" />
        <div className="flex justify-between items-start gap-3 flex-wrap">
          <div>
            <div className="ff-cond tracking-[0.3em] text-[12px] text-green font-bold uppercase">
              FIFA World Cup 2026 <span className="text-dim tracking-[0.2em]">· USA · Canada · Mexico</span>
            </div>
            <h1 className="ff-cond font-bold uppercase leading-[0.92] tracking-tight mt-1"
              style={{ fontSize: "clamp(28px,6.4vw,52px)" }}>
              World Cup 2026 <span className="text-dim">{"// Live Board"}</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setTz(nextTz(tz))} title="Change timezone"
              className="flex items-center gap-1 border border-line2 rounded-full bg-panel2 px-2.5 py-1.5 ff-mono text-[11px] text-muted hover:text-green">
              <Globe size={12} /> {tzLabel(tz)}
            </button>
            <button onClick={() => setSound(!sound)} title={sound ? "Mute goal sound" : "Goal sound on"}
              className="flex items-center border border-line2 rounded-full bg-panel2 p-2 text-muted hover:text-green">
              {sound ? <Volume2 size={13} /> : <VolumeX size={13} />}
            </button>
            <SyncPill source={data.source} reason={data.source === "live" ? "live" : "fallback"} syncedAt={data.syncedAt} isFetching={m.isFetching} onRefresh={() => m.refetch()} />
          </div>
        </div>

        <p className="text-muted text-[13.5px] mt-2 max-w-[56ch]">
          All 104 matches of the first 48-team World Cup — group stage through the final — with venue,
          match day and kickoff. Scores, live minutes and group tables refresh automatically.
        </p>

        <div className="flex flex-wrap gap-2.5 mt-4">
          <NextMatch match={next} />
          <StatsBar matches={matches} total={data.total} />
        </div>

        <LiveTicker matches={matches} />
        <GroupStandings data={s.data} />
      </header>

      <Filters value={filter} counts={counts} onChange={pick} />
      <MatchList matches={list} flashed={flashed} nextN={next?.n ?? null} />

      <footer className="mt-6 text-dim text-[11.5px] ff-mono leading-relaxed border-t border-line pt-3.5">
        <div><b className="text-muted">Live data</b> via TheSportsDB, proxied & cached server-side; group tables computed from results. Falls back to a verified snapshot if the feed is unreachable.</div>
        <div><b className="text-muted">Times</b> shown in {tzLabel(tz)} (tap the globe to switch). Bracket teams & some kickoff times fill in as the tournament unfolds.</div>
      </footer>

      <div aria-live="polite" className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
        {announce}
      </div>
    </div>
  );
}

function isFav(x: ApiMatch, fav: { has: (sport: string, code: string) => boolean }): boolean {
  return (x.home.real && fav.has("soccer", x.home.code)) || (x.away.real && fav.has("soccer", x.away.code));
}
function nextMatch(matches: ApiMatch[]): ApiMatch | null {
  const live = matches.find((x) => x.status === "live");
  if (live) return live;
  const now = Date.now();
  return (
    matches.find((x) => new Date(x.utc).getTime() > now && x.status !== "ft") ||
    matches.find((x) => x.status !== "ft") ||
    null
  );
}
function nextTz(tz: TzMode): TzMode {
  return tz === "ET" ? "local" : tz === "local" ? "UTC" : "ET";
}
function invHash(k: FilterKey): string {
  const map: Record<FilterKey, string> = {
    all: "all", today: "today", live: "live", favs: "favs",
    done: "completed", up: "upcoming", group: "group", ko: "knockouts",
  };
  return map[k];
}
