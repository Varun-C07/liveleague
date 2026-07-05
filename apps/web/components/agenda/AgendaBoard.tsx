"use client";
import { useMemo, useState } from "react";
import type { AgendaResponse, Game } from "@liveleagues/core/sports/types";
import { useAgenda } from "@/hooks/useLive";
import { useMounted } from "@/hooks/useMounted";
import { useFavorites } from "@/hooks/useFavorites";
import { usePrefs } from "@/hooks/usePrefs";
import { AGENDA_BUCKETS, bucketFor, type AgendaBucket } from "@liveleagues/core/sports/agenda-window";
import { SyncPill } from "@/components/shared/SyncPill";
import { AgendaRow } from "./AgendaRow";
import { etParts } from "@/lib/time";

export function AgendaBoard({ initial }: { initial: AgendaResponse }) {
  const q = useAgenda(initial);
  const mounted = useMounted();
  const fav = useFavorites();
  const { tz } = usePrefs();
  const [tab, setTab] = useState<AgendaBucket>("today");
  const [mine, setMine] = useState(false);
  const data = q.data;

  const isFav = (g: Game) => fav.has(g.sport, g.home.code) || fav.has(g.sport, g.away.code);
  // bucket membership depends on "now" → only after mount, to avoid SSR drift
  const now = mounted ? Date.now() : null;

  const counts = useMemo(() => {
    const c: Record<AgendaBucket, number> = { today: 0, week: 0, month: 0 };
    if (now == null) return c;
    for (const g of data.games) {
      if (mine && !isFav(g)) continue;
      const b = bucketFor(new Date(g.utc).getTime(), now);
      if (b) c[b]++;
    }
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.games, mine, now, fav]);

  const groups = useMemo(() => {
    if (now == null) return [];
    const visible = data.games.filter(
      (g) => (!mine || isFav(g)) && bucketFor(new Date(g.utc).getTime(), now) === tab,
    );
    const out: { day: string; games: Game[] }[] = [];
    for (const g of visible) {
      const day = etParts(g.utc, tz).day;
      const last = out[out.length - 1];
      if (last && last.day === day) last.games.push(g);
      else out.push({ day, games: [g] });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.games, tab, mine, now, fav, tz]);

  return (
    <div className="max-w-[1180px] mx-auto px-3.5 pt-5 pb-16">
      <header className="relative overflow-hidden rounded-2xl border border-line glass p-5">
        <span className="absolute left-0 top-0 bottom-0 w-1.5" style={{ background: "var(--accent)" }} />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="ff-cond tracking-[0.28em] text-[12px] font-bold uppercase" style={{ color: "var(--accent)" }}>
              Your Agenda
            </div>
            <h1 className="ff-cond font-bold uppercase leading-[0.92] tracking-tight mt-1" style={{ fontSize: "clamp(28px,6.4vw,52px)" }}>
              My Day <span className="text-dim">{"// Week // Month"}</span>
            </h1>
            <p className="text-muted text-[13.5px] mt-2 max-w-[58ch]">
              Every match on your radar across all five leagues — what&apos;s live now and what&apos;s coming up.
            </p>
          </div>
          <SyncPill source="live" reason="live" syncedAt={data.syncedAt} isFetching={q.isFetching} onRefresh={() => q.refetch()} />
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          {AGENDA_BUCKETS.map((b) => {
            const on = tab === b.key;
            return (
              <button
                key={b.key}
                onClick={() => setTab(b.key)}
                className="ff-cond uppercase tracking-wide font-semibold text-[13px] px-3.5 py-1.5 rounded-md border transition"
                style={on ? { background: "var(--text)", borderColor: "var(--text)", color: "var(--bg)" } : { background: "var(--panel)", borderColor: "var(--line)", color: "var(--muted)" }}
              >
                {b.label}
                <span className="ff-mono text-[11px] opacity-70 ml-1.5">{mounted ? counts[b.key] : ""}</span>
              </button>
            );
          })}
          <button
            onClick={() => setMine((m) => !m)}
            className="ff-cond uppercase tracking-wide font-semibold text-[13px] px-3.5 py-1.5 rounded-md border transition ml-auto"
            style={mine ? { borderColor: "var(--gold)", color: "var(--gold)", background: "color-mix(in srgb, var(--gold) 12%, transparent)" } : { background: "var(--panel)", borderColor: "var(--line)", color: "var(--muted)" }}
            aria-pressed={mine}
          >
            ★ My Teams
          </button>
        </div>
      </header>

      <div className="mt-5 flex flex-col gap-5">
        {!mounted ? (
          <div className="ff-mono text-[12px] text-dim text-center py-10">Loading your agenda…</div>
        ) : groups.length ? (
          groups.map((grp) => (
            <div key={grp.day}>
              <div className="ff-cond uppercase tracking-[0.16em] text-[11px] text-dim mb-2">{grp.day}</div>
              <div className="flex flex-col gap-1.5">
                {grp.games.map((g) => (
                  <AgendaRow key={g.id} g={g} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="ff-mono text-[12px] text-dim text-center py-10 border border-line rounded-lg bg-panel">
            {mine ? "None of your teams are playing in this window." : "Nothing scheduled in this window."}
          </div>
        )}
      </div>
    </div>
  );
}
