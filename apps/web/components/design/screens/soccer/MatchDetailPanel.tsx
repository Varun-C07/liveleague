"use client";

import { useTheme } from "@/components/design/theme";
import type { Theme } from "@/components/design/theme";
import { hex } from "@/components/design/primitives";
import { MapPin, Users } from "@/components/design/icons";
import { useMatchDetail } from "@/hooks/useMatchDetail";
import type { DetailEvent, MatchDetail, Shootout, StatPair, TeamLineup } from "@/lib/espn-summary";

// Rich live + historical match center: timeline, team-stat bars and real lineups,
// fetched on demand and stored in the DB. Rendered inside the expanded LiveMatch
// and fixture rows. `homeColor`/`awayColor` come from the parent's ApiMatch.
export function MatchDetailPanel({
  matchId,
  live,
  homeColor,
  awayColor,
}: {
  matchId: string;
  live: boolean;
  homeColor: string;
  awayColor: string;
}) {
  const { t } = useTheme();
  const { detail, loading } = useMatchDetail(matchId, { enabled: true, live });

  if (loading) {
    return <div style={{ fontSize: 12, color: t.textFaint, padding: "14px 2px" }}>Loading match detail…</div>;
  }
  if (!detail) {
    return (
      <div style={{ fontSize: 12, color: t.textFaint, padding: "14px 2px", lineHeight: 1.5 }}>
        Match detail isn&apos;t available yet — lineups and stats appear around an hour before kick-off.
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <MetaStrip t={t} d={detail} />
      {detail.shootout && <ShootoutView t={t} s={detail.shootout} d={detail} />}
      {detail.events.length > 0 && <Timeline t={t} events={detail.events} homeColor={homeColor} awayColor={awayColor} />}
      {detail.stats.length > 0 && <StatBars t={t} stats={detail.stats} homeColor={homeColor} awayColor={awayColor} />}
      {detail.lineups && (
        <Lineups t={t} d={detail} homeColor={homeColor} awayColor={awayColor} />
      )}
    </div>
  );
}

// Broadcast-style penalty shootout: per side, a kick-by-kick strip (green = scored,
// red = missed) and the tally. The advancing side is emphasised.
function ShootoutView({ t, s, d }: { t: Theme; s: NonNullable<Shootout>; d: MatchDetail }) {
  const homeWon = s.homeScore > s.awayScore;
  return (
    <div>
      <SectionLabel t={t}>🥅 Penalty shootout</SectionLabel>
      <div style={{ display: "grid", gap: 9 }}>
        <ShootoutRow t={t} code={d.home.code} kicks={s.home} score={s.homeScore} won={homeWon} />
        <ShootoutRow t={t} code={d.away.code} kicks={s.away} score={s.awayScore} won={!homeWon} />
      </div>
    </div>
  );
}

function ShootoutRow({ t, code, kicks, score, won }: { t: Theme; code: string; kicks: { player: string; scored: boolean }[]; score: number; won: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span className="cond" style={{ width: 42, fontSize: 13, fontWeight: 800, color: won ? t.text : t.textDim }}>{code}</span>
      <div style={{ display: "flex", gap: 4, flex: 1, flexWrap: "wrap" }}>
        {kicks.map((k, i) => {
          const col = k.scored ? t.win : t.lose;
          return (
            <span
              key={i}
              title={`${k.player}${k.scored ? " — scored" : " — missed"}`}
              style={{ width: 12, height: 12, borderRadius: "50%", background: hex(col, 0.9), boxShadow: `inset 0 0 0 1px ${hex(col, 0.5)}` }}
            />
          );
        })}
      </div>
      <span className="disp num" style={{ fontSize: 17, fontWeight: 800, color: won ? t.text : t.textDim, minWidth: 16, textAlign: "right" }}>{score}</span>
      {won ? <span style={{ fontSize: 9.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", color: t.win }}>adv</span> : <span style={{ width: 22 }} />}
    </div>
  );
}

function SectionLabel({ t, children }: { t: Theme; children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10.5, color: t.textFaint, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
      {children}
    </div>
  );
}

function MetaStrip({ t, d }: { t: Theme; d: MatchDetail }) {
  const bits: { icon: React.ReactNode; text: string }[] = [];
  if (d.venue) bits.push({ icon: <MapPin size={12} />, text: d.venue });
  if (d.attendance) bits.push({ icon: <Users size={12} />, text: `${d.attendance.toLocaleString()} fans` });
  if (d.referee) bits.push({ icon: <span style={{ fontSize: 11 }}>🧑‍⚖️</span>, text: d.referee });
  if (bits.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", fontSize: 11.5, color: t.textDim, fontWeight: 600 }}>
      {bits.map((b, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>{b.icon}{b.text}</span>
      ))}
    </div>
  );
}

const KIND_ICON: Record<DetailEvent["kind"], string> = { goal: "⚽", yellow: "🟨", red: "🟥", sub: "🔁" };

function Timeline({ t, events, homeColor, awayColor }: { t: Theme; events: DetailEvent[]; homeColor: string; awayColor: string }) {
  return (
    <div>
      <SectionLabel t={t}>⏱ Timeline</SectionLabel>
      <div style={{ display: "grid", gap: 2, position: "relative" }}>
        {events.map((e, i) => {
          const col = e.side === "home" ? homeColor : e.side === "away" ? awayColor : t.textFaint;
          const isGoal = e.kind === "goal";
          return (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "6px 0", borderLeft: `2px solid ${hex(col, 0.5)}`, paddingLeft: 11, marginLeft: 2 }}>
              <span className="num" style={{ width: 38, flexShrink: 0, fontSize: 11.5, fontWeight: 800, color: t.textDim, paddingTop: 1 }}>{e.minute}</span>
              <span style={{ fontSize: 13, flexShrink: 0, lineHeight: 1.2 }}>{KIND_ICON[e.kind]}</span>
              <div style={{ minWidth: 0 }}>
                {e.player && <div style={{ fontSize: 12.5, fontWeight: isGoal ? 800 : 600, color: isGoal ? t.text : t.textDim }}>{e.player}</div>}
                <div style={{ fontSize: 11.5, color: t.textFaint, lineHeight: 1.45 }}>{e.text}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatBars({ t, stats, homeColor, awayColor }: { t: Theme; stats: StatPair[]; homeColor: string; awayColor: string }) {
  return (
    <div>
      <SectionLabel t={t}>📊 Match stats</SectionLabel>
      <div style={{ display: "grid", gap: 11 }}>
        {stats.map((s) => {
          // Bar widths are always relative to each other (home vs away) — even
          // for "%" stats like pass accuracy, where the two values are
          // independent and don't sum to 100. The labels show the true values.
          const sum = s.home + s.away || 1;
          const hPct = Math.round((s.home / sum) * 100);
          const aPct = 100 - hPct;
          const fmt = (v: number) => (s.pct ? `${Math.round(v)}%` : `${v}`);
          return (
            <div key={s.key}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11.5, marginBottom: 4 }}>
                <span className="num" style={{ fontWeight: 800, color: t.text }}>{fmt(s.home)}</span>
                <span style={{ color: t.textDim, fontWeight: 600 }}>{s.label}</span>
                <span className="num" style={{ fontWeight: 800, color: t.text }}>{fmt(s.away)}</span>
              </div>
              <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", background: hex(t.border, 0.5), gap: 2 }}>
                <div style={{ width: `${hPct}%`, background: homeColor, borderRadius: "3px 0 0 3px" }} />
                <div style={{ width: `${aPct}%`, background: awayColor, borderRadius: "0 3px 3px 0", marginLeft: "auto" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Lineups({ t, d, homeColor, awayColor }: { t: Theme; d: MatchDetail; homeColor: string; awayColor: string }) {
  if (!d.lineups) return null;
  return (
    <div>
      <SectionLabel t={t}><Users size={13} /> Lineups</SectionLabel>
      <div style={{ display: "grid", gap: 14 }}>
        <TeamLineupView t={t} code={d.home.code} lineup={d.lineups.home} color={homeColor} />
        <TeamLineupView t={t} code={d.away.code} lineup={d.lineups.away} color={awayColor} />
      </div>
    </div>
  );
}

// Parse a formation string ("3-5-2") into rows of starters (GK first).
function formationRows(lineup: TeamLineup): { rows: number[]; ok: boolean } {
  const parts = (lineup.formation || "").split("-").map((x) => parseInt(x, 10)).filter((n) => n > 0);
  const outfield = parts.reduce((a, b) => a + b, 0);
  const ok = parts.length > 0 && outfield + 1 === lineup.starters.length;
  return { rows: [1, ...parts], ok };
}

function TeamLineupView({ t, code, lineup, color }: { t: Theme; code: string; lineup: TeamLineup; color: string }) {
  const { rows, ok } = formationRows(lineup);
  return (
    <div style={{ padding: "11px 13px", borderRadius: 12, background: t.surfaceHi, boxShadow: `inset 0 0 0 1px ${hex(t.border, 0.5)}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
        <span style={{ fontSize: 12.5, fontWeight: 800, color: t.text }}>{code}</span>
        {lineup.formation && (
          <span className="num" style={{ fontSize: 11.5, fontWeight: 800, color, letterSpacing: ".04em" }}>{lineup.formation}</span>
        )}
      </div>
      {ok ? <Pitch t={t} rows={rows} starters={lineup.starters} color={color} /> : <XiList t={t} lineup={lineup} />}
    </div>
  );
}

// Mini-pitch: place starters by formation row (GK at the back). Each node is the
// jersey number; tap target shows nothing extra — names are in the XI fallback.
function Pitch({ t, rows, starters, color }: { t: Theme; rows: number[]; starters: { jersey: string | null; name: string }[]; color: string }) {
  const nodes: { x: number; y: number; n: string }[] = [];
  let idx = 0;
  rows.forEach((count, r) => {
    const y = 12 + (r / (rows.length - 1)) * 76; // 12%..88%, GK at top
    for (let c = 0; c < count; c++) {
      const x = ((c + 1) / (count + 1)) * 100;
      const p = starters[idx++];
      if (p) nodes.push({ x, y, n: p.jersey || "" });
    }
  });
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 11", borderRadius: 9, overflow: "hidden", background: `linear-gradient(180deg, ${hex(color, 0.08)}, transparent 55%), ${t.surface}` }}>
      <svg viewBox="0 0 100 68.75" width="100%" height="100%" preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }}>
        <rect x="2" y="2" width="96" height="64.75" fill="none" stroke={hex(t.textFaint, 0.3)} strokeWidth=".4" />
        <line x1="2" y1="34.4" x2="98" y2="34.4" stroke={hex(t.textFaint, 0.25)} strokeWidth=".4" />
        <circle cx="50" cy="34.4" r="7" fill="none" stroke={hex(t.textFaint, 0.25)} strokeWidth=".4" />
      </svg>
      {nodes.map((nd, i) => (
        <div key={i} className="num" style={{ position: "absolute", left: `${nd.x}%`, top: `${nd.y}%`, transform: "translate(-50%,-50%)", width: 20, height: 20, borderRadius: "50%", background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, border: `1.5px solid ${hex("#fff", 0.25)}`, boxShadow: `0 2px 6px ${hex("#000", 0.4)}` }}>
          {nd.n}
        </div>
      ))}
    </div>
  );
}

function XiList({ t, lineup }: { t: Theme; lineup: TeamLineup }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 12px" }}>
      {lineup.starters.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, color: t.textDim }}>
          <span className="num" style={{ width: 18, color: t.textFaint, fontWeight: 700 }}>{p.jersey}</span>
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
          {p.pos && <span style={{ fontSize: 9.5, color: t.textFaint, fontWeight: 700 }}>{p.pos}</span>}
        </div>
      ))}
    </div>
  );
}
