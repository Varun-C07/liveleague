"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useTheme, type Theme } from "@/components/design/theme";
import { card, hex, Crest, SL } from "@/components/design/primitives";
import { MapPin, Lock, Calendar } from "@/components/design/icons";
import { isLightColor, dateLabel, kickoffDateTimeLabel, mapGroupOutlooks } from "@/components/design/map";
import { LiveDot, TickingMinute, FlashScore } from "@/components/design/motion";
import { LockedPanel } from "@/components/design/LockedPanel";
import { MatchDetailPanel } from "@/components/design/screens/soccer/MatchDetailPanel";
import { useMatches, useStandings } from "@/hooks/useMatches";
import { useMatchDetail } from "@/hooks/useMatchDetail";
import { useWinProb } from "@/hooks/useWinProb";
import { matchPredictor, type Predictor } from "@/components/design/screens/match/matchData";
import type { ApiMatch, MatchesResponse, StandingsResponse } from "@/lib/api-shape";
import type { FormEntry } from "@/lib/espn-summary";

type Team = ApiMatch["home"];

// Canonical match page: the real match center (timeline / stats / lineups) plus
// real recent form + head-to-head (ESPN), real qualification stakes (group
// solver), and the win-probability bundle tease.
export function Match({ initial, standings, n }: { initial: MatchesResponse; standings: StandingsResponse; n: number }) {
  const { t } = useTheme();
  const { data } = useMatches(initial); // keeps the match live (polls /api/soccer)
  const { data: sr } = useStandings(standings);
  const matches = data?.matches ?? initial.matches;
  const m = useMemo(
    () => matches.find((x) => x.n === n) ?? initial.matches.find((x) => x.n === n) ?? null,
    [matches, initial, n],
  );

  const live = m?.status === "live";
  const ft = m?.status === "ft";
  const { detail } = useMatchDetail(`soccer-${n}`, { enabled: !!m, live: !!live });

  const outlooks = useMemo(() => mapGroupOutlooks(sr?.groups ?? {}, matches), [sr, matches]);

  if (!m) {
    return (
      <div className="rise" style={{ maxWidth: 760, margin: "0 auto", paddingTop: 18 }}>
        <BackLink t={t} />
        <div style={{ ...card(t), padding: 20, marginTop: 14 }}>
          <span style={{ color: t.textDim }}>Match not found.</span>
        </div>
      </div>
    );
  }

  const score = m.status === "sched" ? "vs" : `${m.homeScore ?? 0}–${m.awayScore ?? 0}`;
  const loc = [m.venue, m.city].filter(Boolean).join(", ");
  const h2h = detail?.h2h ?? [];
  const stakes = m.grp && outlooks[m.grp]
    ? [
        { team: m.home, line: outlooks[m.grp][m.home.code]?.line },
        { team: m.away, line: outlooks[m.grp][m.away.code]?.line },
      ].filter((s) => s.line)
    : [];

  return (
    <div className="rise" style={{ maxWidth: 760, margin: "0 auto", paddingTop: 18 }}>
      <BackLink t={t} />

      {/* HEADER */}
      <div style={{ position: "relative", overflow: "hidden", marginTop: 14, ...card(t, live ? { ring: hex(t.live, 0.45) } : {}) }}>
        {live ? (
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, overflow: "hidden" }}>
            <div style={{ width: "30%", height: "100%", background: t.live, animation: "llscan 2.6s linear infinite" }} />
          </div>
        ) : null}
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg,${hex(m.home.color, 0.4)},transparent 42%,transparent 58%,${hex(m.away.color, 0.4)})` }} />
        <div style={{ position: "relative", padding: "20px 22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 10 }}>
            <span style={{ fontSize: 11, color: t.textDim, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.stage}</span>
            {live ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, color: t.live, whiteSpace: "nowrap" }}>
                <LiveDot color={t.live} size={6} /> LIVE <TickingMinute value={m.minute || "LIVE"} />
              </span>
            ) : (
              <span style={{ fontSize: 12, color: t.textDim, fontWeight: 700, whiteSpace: "nowrap" }}>{ft ? `FT · ${dateLabel(m.utc)}` : kickoffDateTimeLabel(m.utc)}</span>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 10 }}>
            <Side t={t} team={m.home} />
            <span className="disp num" style={{ fontSize: "clamp(30px,7vw,44px)", fontWeight: 800, lineHeight: 1, whiteSpace: "nowrap" }}>
              {live ? <FlashScore score={score} accent={t.accent} settle={t.text} /> : <span style={{ color: ft ? t.text : t.textDim }}>{score}</span>}
            </span>
            <Side t={t} team={m.away} />
          </div>
          {loc ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 16, fontSize: 11.5, color: t.textFaint }}>
              <MapPin size={12} />{loc}
            </div>
          ) : null}
        </div>
      </div>

      {/* REAL match center — timeline / stats / lineups (live + finished) */}
      {(live || ft) && (
        <div style={{ marginTop: 22, ...card(t), padding: "18px 20px" }}>
          <MatchDetailPanel matchId={`soccer-${n}`} live={!!live} homeColor={m.home.color} awayColor={m.away.color} />
        </div>
      )}

      {/* FREE — recent form (real, ESPN) */}
      {detail && (detail.form.home.length > 0 || detail.form.away.length > 0) && (
        <div style={{ marginTop: 26 }}>
          <SL t={t}>Recent form</SL>
          <div style={{ ...card(t), padding: "14px 16px", display: "grid", gap: 13 }}>
            <FormRow t={t} team={m.home} entries={detail.form.home} />
            <FormRow t={t} team={m.away} entries={detail.form.away} />
          </div>
        </div>
      )}

      {/* FREE — head to head (real, ESPN) */}
      {h2h.length > 0 && (
        <div style={{ marginTop: 26 }}>
          <SL t={t}>Head to head</SL>
          <div style={{ ...card(t) }}>
            {h2h.map((g, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", borderTop: i ? `1px solid ${hex(t.border, 0.5)}` : "none" }}>
                <span className="num" style={{ fontSize: 11.5, color: t.textFaint, fontWeight: 700, width: 52 }}>{g.date.slice(0, 4)}</span>
                <span className="cond" style={{ flex: 1, fontSize: 13, fontWeight: 700, textAlign: "right" }}>{g.home}</span>
                <span className="disp num" style={{ fontSize: 15, fontWeight: 800, minWidth: 46, textAlign: "center" }}>{g.score.replace("-", "–")}</span>
                <span className="cond" style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{g.away}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FREE — what's at stake (real, group solver) */}
      <div style={{ marginTop: 26 }}>
        <SL t={t}>What&apos;s at stake</SL>
        {stakes.length > 0 ? (
          <div style={{ ...card(t), padding: "6px 16px" }}>
            {stakes.map((s, i) => (
              <div key={s.team.code} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 0", borderTop: i ? `1px solid ${hex(t.border, 0.5)}` : "none" }}>
                <Crest code={s.team.code} color={s.team.color} dark={isLightColor(s.team.color)} size={20} />
                <span className="cond" style={{ fontWeight: 700, fontSize: 13, width: 96, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.team.name}</span>
                <span style={{ flex: 1, fontSize: 13, color: t.text }}>{s.line}</span>
              </div>
            ))}
            <div style={{ fontSize: 10.5, color: t.textFaint, padding: "0 0 9px" }}>Top 2 advance · best 8 third-placed teams also qualify</div>
          </div>
        ) : (
          <div style={{ ...card(t), padding: "14px 16px", display: "flex", gap: 11, alignItems: "center" }}>
            <Calendar size={16} color={t.textDim} />
            <span style={{ fontSize: 13.5, color: t.text, lineHeight: 1.5 }}>Single-leg knockout — the winner advances, the loser is out.</span>
          </div>
        )}
      </div>

      {/* PAID — real win probability for entitled users, sample tease otherwise */}
      <WinProbSection t={t} m={m} live={!!live} />
    </div>
  );
}

function BackLink({ t }: { t: Theme }) {
  return (
    <Link href="/soccer" className="navpill" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, color: t.textDim, textDecoration: "none", padding: "5px 10px 5px 6px", borderRadius: 8 }}>
      <span style={{ fontSize: 15, lineHeight: 1 }}>←</span> Back to fixtures
    </Link>
  );
}

function Side({ t, team }: { t: Theme; team: Team }) {
  const inner = (
    <>
      <div style={{ display: "inline-block" }}>
        <Crest code={team.code} color={team.color} dark={isLightColor(team.color)} size={46} />
      </div>
      <div className="cond" style={{ fontSize: 14, fontWeight: 700, marginTop: 8, color: t.text }}>{team.name.toUpperCase()}</div>
    </>
  );
  // Placeholder teams (e.g. "2A" / "W74") have no profile page.
  if (!team.real) return <div style={{ textAlign: "center" }}>{inner}</div>;
  return (
    <Link href={`/soccer/team/${team.code}`} className="ll-team-link" style={{ display: "block", textAlign: "center", textDecoration: "none", color: t.text }}>
      {inner}
    </Link>
  );
}

function FormRow({ t, team, entries }: { t: Theme; team: Team; entries: FormEntry[] }) {
  const col = (r: FormEntry["result"]) => (r === "W" ? t.win : r === "D" ? t.neutral : t.lose);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <Crest code={team.code} color={team.color} dark={isLightColor(team.color)} size={22} />
      <span className="cond" style={{ flex: 1, fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{team.name}</span>
      <div style={{ display: "flex", gap: 5 }}>
        {entries.length === 0 ? (
          <span style={{ fontSize: 11.5, color: t.textFaint }}>—</span>
        ) : (
          entries.map((e, i) => (
            <span key={i} title={`${e.score} vs ${e.opp}`} style={{ width: 22, height: 22, borderRadius: 6, display: "grid", placeItems: "center", fontSize: 11, fontWeight: 800, color: col(e.result), background: hex(col(e.result), 0.16), border: `1px solid ${hex(col(e.result), 0.4)}` }}>
              {e.result}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

// Shared probability bar (home / draw / away segments + labels + pick line). Used
// both unlocked (real model) and behind the lock (sample tease).
function WinProbBar({ t, m, p }: { t: Theme; m: ApiMatch; p: Predictor }) {
  const segs = [
    { w: p.home, c: m.home.color, label: m.home.code },
    { w: p.draw, c: t.neutral, label: "Draw" },
    { w: p.away, c: m.away.color, label: m.away.code },
  ];
  return (
    <>
      <div style={{ display: "flex", height: 14, borderRadius: 7, overflow: "hidden" }}>
        {segs.map((s, i) => <div key={i} style={{ width: `${s.w}%`, background: s.c }} />)}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 9 }}>
        {segs.map((s, i) => (
          <span key={i} className="num" style={{ fontSize: 12, fontWeight: 800, color: t.textDim }}>{s.label} {s.w}%</span>
        ))}
      </div>
      <div style={{ marginTop: 14, fontSize: 12.5, color: t.textDim }}>{p.pick} · predicted {p.scoreline}</div>
    </>
  );
}

// Win probability: the real Elo + Poisson model for $5-bundle users, or a clearly
// labelled sample behind the premium lock for everyone else (the server route is
// the real gate — free users never receive the real numbers).
function WinProbSection({ t, m, live }: { t: Theme; m: ApiMatch; live: boolean }) {
  const { winProb, entitled, loading } = useWinProb(`soccer-${m.n}`, { enabled: true, live });

  // Entitled (always, while the paywall is off) → the real model, unlocked.
  if (entitled) {
    return (
      <div style={{ marginTop: 26 }}>
        <SL t={t}>Win probability</SL>
        <div style={{ ...card(t), padding: "16px 18px" }}>
          {winProb ? (
            <>
              <WinProbBar t={t} m={m} p={winProb} />
              <div style={{ marginTop: 12, fontSize: 10.5, color: t.textFaint, display: "flex", alignItems: "center", gap: 6 }}>
                {live ? <LiveDot color={t.live} size={5} /> : null}
                {winProb.basis}{live ? " · updates live" : ""}
              </div>
            </>
          ) : (
            <span style={{ fontSize: 12.5, color: t.textDim }}>
              {loading ? "Calculating win probability…" : "Win probability isn’t available for this match yet."}
            </span>
          )}
        </div>
      </div>
    );
  }

  const sample = matchPredictor(m);
  return (
    <div style={{ marginTop: 26 }}>
      <SL t={t}>
        Win probability
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10.5, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: t.gold, background: hex(t.gold, 0.12), border: `1px solid ${hex(t.gold, 0.3)}`, borderRadius: 999, padding: "3px 9px" }}>
          <Lock size={11} /> Bundle
        </span>
      </SL>
      <LockedPanel
        t={t}
        title="Win probability & predictor"
        copy="Live win probability and the match predictor are part of the $5 World Cup Bundle."
      >
        <WinProbBar t={t} m={m} p={sample} />
        <div style={{ marginTop: 10, fontSize: 10.5, color: t.textFaint }}>Sample — not the live model</div>
      </LockedPanel>
    </div>
  );
}
