"use client";
import { useMemo } from "react";
import { motion } from "framer-motion";
import type { LiveOverview } from "@liveleagues/core/sports/types";
import { useOverview } from "@/hooks/useLive";
import { SyncPill } from "@/components/shared/SyncPill";
import { GameTicker } from "@/components/shared/GameTicker";
import { LiveStatusCard } from "@/components/shared/LiveStatusCard";

export function HomeBoard({ initial }: { initial: LiveOverview }) {
  const q = useOverview(initial);
  const data = q.data;

  const allGames = useMemo(() => data.sports.flatMap((s) => s.topGames), [data]);
  const anyLive = data.totalLive > 0;
  const anyLiveFeed = data.sports.some((s) => s.reason === "live");
  const source = anyLiveFeed ? "live" : "snapshot";
  // Global reason: prefer live, then surface a real outage, else empty/sample.
  const reason = anyLiveFeed
    ? "live"
    : data.sports.some((s) => s.reason === "fallback")
      ? "fallback"
      : data.sports.some((s) => s.reason === "empty")
        ? "empty"
        : "sample";

  return (
    <div className="max-w-[1180px] mx-auto px-3.5 pt-5 pb-16">
      {/* hero */}
      <header className="relative overflow-hidden rounded-2xl border border-line glass p-5 sm:p-7">
        <span className="absolute left-0 top-0 bottom-0 w-1.5" style={{ background: "var(--accent)" }} />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="ff-cond tracking-[0.3em] text-[12px] font-bold uppercase" style={{ color: "var(--accent)" }}>
              Multi-Sport Live Tracker
            </div>
            <h1
              className="ff-cond font-bold uppercase leading-[0.9] tracking-tight mt-1"
              style={{ fontSize: "clamp(34px,8vw,68px)" }}
            >
              Live<span className="text-dim">League</span>
            </h1>
            <p className="text-muted text-[14px] mt-2.5 max-w-[60ch]">
              One board for every league that matters — Formula 1, the World Cup, the NBA, cricket and the
              MLB. Scores, standings and start times that refresh themselves.
            </p>
          </div>
          <SyncPill source={source} reason={reason} syncedAt={data.syncedAt} isFetching={q.isFetching} onRefresh={() => q.refetch()} />
        </div>

        {/* quick stats */}
        <div className="flex flex-wrap gap-2.5 mt-5">
          <HeroStat
            label="Live Right Now"
            value={
              anyLive ? (
                <span style={{ color: "var(--accent)" }}>
                  <span className="anim-blink">●</span> {data.totalLive}
                </span>
              ) : (
                "0"
              )
            }
            sub={anyLive ? "games in play" : "nothing live"}
            glow={anyLive}
          />
          <HeroStat label="Leagues Tracked" value={data.sports.length} sub="and counting" />
          <HeroStat
            label="Events Today"
            value={data.sports.reduce(
              (a, s) => a + s.topGames.filter((g) => g.status === "live" || g.status === "sched").length,
              0,
            )}
            sub="live + upcoming"
          />
        </div>

        <GameTicker games={allGames} showSport limit={16} />
      </header>

      {/* league cards */}
      <div className="flex items-baseline justify-between mt-7 mb-3">
        <h2 className="ff-cond uppercase tracking-[0.16em] text-[13px] text-muted font-bold">Leagues</h2>
        <span className="ff-mono text-[11px] text-dim">tap a league for the full board</span>
      </div>
      <motion.div
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))" }}
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.05 } } }}
      >
        {data.sports.map((s) => (
          <motion.div
            key={s.id}
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <LiveStatusCard s={s} />
          </motion.div>
        ))}
      </motion.div>

      <footer className="mt-8 text-dim text-[11.5px] ff-mono leading-relaxed border-t border-line pt-4">
        <div>
          <b className="text-muted">Live data</b> proxied & cached server-side from open feeds (Jolpica F1,
          TheSportsDB, ESPN). Each league falls back to a verified snapshot if its feed is unreachable.
        </div>
        <div>
          <b className="text-muted">Refresh</b> is adaptive — fast while games are live, slower when the
          slate is quiet.
        </div>
      </footer>
    </div>
  );
}

function HeroStat({
  label,
  value,
  sub,
  glow,
}: {
  label: string;
  value: React.ReactNode;
  sub: string;
  glow?: boolean;
}) {
  return (
    <div
      className="flex-1 min-w-[150px] border rounded-xl bg-panel2 px-3.5 py-3"
      style={{
        borderColor: glow ? "var(--accent)" : "var(--line2)",
        boxShadow: glow ? "0 0 24px -12px var(--accent)" : undefined,
      }}
    >
      <div className="ff-cond text-[11px] tracking-[0.16em] text-muted uppercase">{label}</div>
      <div className="ff-cond font-bold text-[26px] mt-0.5 leading-none">{value}</div>
      <div className="ff-mono text-[10.5px] text-dim mt-1.5">{sub}</div>
    </div>
  );
}
