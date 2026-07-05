"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useTheme, type Theme } from "@/components/design/theme";
import { card, hex, Crest, SL } from "@/components/design/primitives";
import { Lock } from "@/components/design/icons";
import { isLightColor, dateLabel, kickoffLabel } from "@/components/design/map";
import { LockedPanel } from "@/components/design/LockedPanel";
import { PAYWALL_ENABLED, SHOW_PLACEHOLDERS } from "@liveleagues/core/gating";
import { PlayerTags } from "@/components/design/PlayerTags";
import { recentForm, type FormResult } from "@/components/design/screens/match/matchData";
import { teamSquad, teamAnalysis, hasRealSquad, type Player } from "@/components/design/screens/team/teamData";
import { useMatches, useStandings } from "@/hooks/useMatches";
import { TEAMS } from "@/data/teams";
import type { MatchesResponse, StandingsResponse, ApiMatch } from "@liveleagues/core/api-shape";

const ORD = (n: number) => (n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`);

export function Team({
  initialMatches,
  initialStandings,
  code,
}: {
  initialMatches: MatchesResponse;
  initialStandings: StandingsResponse;
  code: string;
}) {
  const { t } = useTheme();
  const { data: mr } = useMatches(initialMatches);
  const { data: sr } = useStandings(initialStandings);
  const matches = mr?.matches ?? initialMatches.matches;
  const groups = sr?.groups ?? initialStandings.groups;

  const team = TEAMS[code as keyof typeof TEAMS];
  const grp = team?.grp ?? null;

  const standing = useMemo(() => {
    if (!grp || !groups[grp]) return null;
    const rows = groups[grp];
    const idx = rows.findIndex((r) => r.code === code);
    return idx < 0 ? null : { pos: idx + 1, pts: rows[idx].Pts };
  }, [groups, grp, code]);

  const history = useMemo(
    () =>
      matches
        .filter((m) => m.home.code === code || m.away.code === code)
        .sort((a, b) => a.utc.localeCompare(b.utc)),
    [matches, code],
  );

  if (!team) {
    return (
      <div className="rise" style={{ maxWidth: 760, margin: "0 auto", paddingTop: 18 }}>
        <BackLink t={t} />
        <div style={{ ...card(t), padding: 20, marginTop: 14 }}>
          <span style={{ color: t.textDim }}>Team not found.</span>
        </div>
      </div>
    );
  }

  const squad = teamSquad(code);
  const analysis = teamAnalysis({ code, name: team.name, grp });
  const showSquad = hasRealSquad(code) || SHOW_PLACEHOLDERS;
  const fc = (r: FormResult) => (r === "W" ? t.win : r === "D" ? t.neutral : t.lose);

  return (
    <div className="rise" style={{ maxWidth: 760, margin: "0 auto", paddingTop: 18 }}>
      <BackLink t={t} />

      {/* HEADER — free */}
      <div style={{ position: "relative", overflow: "hidden", marginTop: 14, ...card(t) }}>
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(120deg, ${hex(team.color, 0.45)}, transparent 60%)` }} />
        <div style={{ position: "relative", padding: "22px 22px", display: "flex", alignItems: "center", gap: 16 }}>
          <Crest code={code} color={team.color} dark={isLightColor(team.color)} size={58} />
          <div style={{ minWidth: 0 }}>
            <div className="disp" style={{ fontSize: "clamp(26px,6vw,36px)", fontWeight: 800, lineHeight: 1 }}>{team.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 9, flexWrap: "wrap" }}>
              {grp ? <Chip t={t}>Group {grp}</Chip> : null}
              {standing ? (
                <span style={{ fontSize: 12.5, color: t.textDim, fontWeight: 600 }}>
                  <b style={{ color: standing.pos <= 2 ? t.win : t.text }}>{ORD(standing.pos)}</b> · {standing.pts} pts
                </span>
              ) : null}
              {SHOW_PLACEHOLDERS ? (
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  {recentForm(code).map((r, i) => (
                    <span key={i} style={{ width: 18, height: 18, borderRadius: 4, display: "grid", placeItems: "center", fontSize: 9.5, fontWeight: 800, color: fc(r), background: hex(fc(r), 0.16), border: `1px solid ${hex(fc(r), 0.4)}` }}>{r}</span>
                  ))}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* MATCH HISTORY — free, each row → match-detail */}
      <div style={{ marginTop: 26 }}>
        <SL t={t}>Matches</SL>
        <div style={{ display: "grid", gap: 8 }}>
          {history.map((m) => <HistoryRow key={m.n} t={t} m={m} code={code} />)}
        </div>
      </div>

      {/* SQUAD — free for hand-verified rosters; generic placeholder squads are
          hidden (we don't pass off invented names as the real lineup). */}
      <div style={{ marginTop: 26 }}>
        <SL t={t}>Squad</SL>
        {showSquad ? (
          <div style={{ display: "grid", gap: 6 }}>
            {squad.map((p) => <SquadRow key={p.id} t={t} p={p} />)}
          </div>
        ) : (
          <div style={{ ...card(t), padding: "14px 16px" }}>
            <span style={{ fontSize: 13, color: t.textDim }}>Confirmed squad list isn&apos;t available yet for {team.name}.</span>
          </div>
        )}
      </div>

      {/* PAID — prediction & analysis, behind glass. Hidden while the paywall is
          off: this projection is placeholder data (no free 2026 source), so we
          don't surface it as if it were real — it returns with the paywall. */}
      {PAYWALL_ENABLED ? (
        <div style={{ marginTop: 26 }}>
          <SL t={t}>
            Prediction &amp; analysis
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10.5, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: t.gold, background: hex(t.gold, 0.12), border: `1px solid ${hex(t.gold, 0.3)}`, borderRadius: 999, padding: "3px 9px" }}>
              <Lock size={11} /> Bundle
            </span>
          </SL>
          <LockedPanel t={t} title={`${team.name} · projection`} copy="Qualification odds, projected finish and title chances are part of the $5 World Cup Bundle.">
            <div style={{ display: "grid", gap: 10 }}>
              <AnalysisRow t={t} label="Reach knockouts" value={`${analysis.qualifyPct}%`} pct={analysis.qualifyPct} color={t.win} />
              <AnalysisRow t={t} label="Projected finish" value={analysis.finish} />
              <AnalysisRow t={t} label="Win the tournament" value={`${analysis.titlePct}%`} pct={analysis.titlePct} color={t.gold} />
              <div style={{ fontSize: 12.5, color: t.textDim, marginTop: 2 }}>{analysis.note}</div>
            </div>
          </LockedPanel>
        </div>
      ) : null}
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

function Chip({ t, children }: { t: Theme; children: React.ReactNode }) {
  return (
    <span className="cond" style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".04em", textTransform: "uppercase", color: t.textDim, background: t.chip, borderRadius: 6, padding: "3px 9px" }}>{children}</span>
  );
}

function HistoryRow({ t, m, code }: { t: Theme; m: ApiMatch; code: string }) {
  const isHome = m.home.code === code;
  const opp = isHome ? m.away : m.home;
  const played = m.status !== "sched";
  const gf = isHome ? m.homeScore : m.awayScore;
  const ga = isHome ? m.awayScore : m.homeScore;
  const res = played && gf != null && ga != null ? (gf > ga ? "W" : gf < ga ? "L" : "D") : null;
  const resColor = res === "W" ? t.win : res === "L" ? t.lose : t.neutral;
  return (
    <Link href={`/soccer/match/${m.n}`} className="ll-fixture-row" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 13px", textDecoration: "none", color: t.text, ...card(t) }}>
      <span style={{ width: 18, fontSize: 10, fontWeight: 800, color: t.textFaint }}>{isHome ? "H" : "A"}</span>
      <Crest code={opp.code} color={opp.color} dark={isLightColor(opp.color)} size={22} />
      <span className="cond" style={{ flex: 1, fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{opp.name}</span>
      {played ? (
        <span className="disp num" style={{ fontSize: 15, fontWeight: 800, color: res ? resColor : t.text }}>{m.homeScore}–{m.awayScore}</span>
      ) : (
        <span style={{ fontSize: 11.5, color: t.textDim, fontWeight: 700 }}>{dateLabel(m.utc)} · {kickoffLabel(m.utc)}</span>
      )}
    </Link>
  );
}

function SquadRow({ t, p }: { t: Theme; p: Player }) {
  return (
    <Link href={`/soccer/player/${p.id}`} id={`player-${p.id}`} className="ll-fixture-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 13px", textDecoration: "none", color: t.text, ...card(t) }}>
      <span className="num" style={{ width: 22, fontSize: 13, fontWeight: 800, color: t.textFaint, textAlign: "center" }}>{p.number}</span>
      <span style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 7 }}>
        <span className="cond" style={{ fontSize: 13.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
        <PlayerTags t={t} captain={p.isCaptain} goalkeeper={p.isGoalkeeper} />
      </span>
      <span style={{ fontSize: 11, color: t.textDim, fontWeight: 700, width: 30, textAlign: "right" }}>{p.pos}</span>
      {SHOW_PLACEHOLDERS ? (
        <span className="num" style={{ fontSize: 11.5, color: t.textFaint, fontWeight: 700 }}>{p.age}y</span>
      ) : null}
    </Link>
  );
}

function AnalysisRow({ t, label, value, pct, color }: { t: Theme; label: string; value: string; pct?: number; color?: string }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: pct != null ? 5 : 0 }}>
        <span style={{ color: t.textDim, fontWeight: 600 }}>{label}</span>
        <span className="num" style={{ fontWeight: 800 }}>{value}</span>
      </div>
      {pct != null ? (
        <div style={{ height: 7, background: t.chip, borderRadius: 4, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: color ?? t.accent, borderRadius: 4 }} />
        </div>
      ) : null}
    </div>
  );
}
