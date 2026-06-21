"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useTheme, type Theme } from "@/components/design/theme";
import { card, hex, unskew, Crest, SL } from "@/components/design/primitives";
import { ChevronRight, MapPin, Lock, Calendar } from "@/components/design/icons";
import { isLightColor, dateLabel, kickoffDateTimeLabel } from "@/components/design/map";
import { LiveDot, TickingMinute, FlashScore } from "@/components/design/motion";
import { useMatches } from "@/hooks/useMatches";
import {
  recentForm, headToHead, matchPredictor, stakesLine, type FormResult,
} from "@/components/design/screens/match/matchData";
import type { ApiMatch, MatchesResponse } from "@/lib/api-shape";

type Team = ApiMatch["home"];

export function Match({ initial, n }: { initial: MatchesResponse; n: number }) {
  const { t } = useTheme();
  const { data } = useMatches(initial); // keeps the match live (polls /api/soccer)
  const matches = data?.matches ?? initial.matches;
  const m = useMemo(
    () => matches.find((x) => x.n === n) ?? initial.matches.find((x) => x.n === n) ?? null,
    [matches, initial, n],
  );
  const h2h = useMemo(() => (m ? headToHead(m.home.code, m.away.code) : []), [m]);

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

  const live = m.status === "live";
  const ft = m.status === "ft";
  const score = m.status === "sched" ? "vs" : `${m.homeScore ?? 0}–${m.awayScore ?? 0}`;
  const loc = [m.venue, m.city].filter(Boolean).join(", ");

  return (
    <div className="rise" style={{ maxWidth: 760, margin: "0 auto", paddingTop: 18 }}>
      <BackLink t={t} />

      {/* HEADER — free, with live signal when live */}
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
              {live ? (
                <FlashScore score={score} accent={t.accent} settle={t.text} />
              ) : (
                <span style={{ color: ft ? t.text : t.textDim }}>{score}</span>
              )}
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

      {/* FREE — recent form */}
      <div style={{ marginTop: 26 }}>
        <SL t={t}>Recent form</SL>
        <div style={{ ...card(t), padding: "14px 16px", display: "grid", gap: 13 }}>
          <FormRow t={t} team={m.home} />
          <FormRow t={t} team={m.away} />
        </div>
      </div>

      {/* FREE — head to head */}
      <div style={{ marginTop: 26 }}>
        <SL t={t}>Head to head</SL>
        <div style={{ ...card(t) }}>
          {h2h.map((g, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", borderTop: i ? `1px solid ${hex(t.border, 0.5)}` : "none" }}>
              <span className="num" style={{ fontSize: 11.5, color: t.textFaint, fontWeight: 700, width: 38 }}>{g.year}</span>
              <span className="cond" style={{ flex: 1, fontSize: 13, fontWeight: 700, textAlign: "right" }}>{g.homeCode}</span>
              <span className="disp num" style={{ fontSize: 15, fontWeight: 800, minWidth: 46, textAlign: "center" }}>{g.homeScore}–{g.awayScore}</span>
              <span className="cond" style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{g.awayCode}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FREE — what's at stake */}
      <div style={{ marginTop: 26 }}>
        <SL t={t}>What&apos;s at stake</SL>
        <div style={{ ...card(t), padding: "14px 16px", display: "flex", gap: 11, alignItems: "center" }}>
          <Calendar size={16} color={t.textDim} />
          <span style={{ fontSize: 13.5, color: t.text, lineHeight: 1.5 }}>{stakesLine(m)}</span>
        </div>
      </div>

      {/* PAID — win probability + predictor, behind glass */}
      <div style={{ marginTop: 26 }}>
        <SL t={t}>
          Win probability
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10.5, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: t.gold, background: hex(t.gold, 0.12), border: `1px solid ${hex(t.gold, 0.3)}`, borderRadius: 999, padding: "3px 9px" }}>
            <Lock size={11} /> Bundle
          </span>
        </SL>
        <LockedPredictor t={t} m={m} />
      </div>
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
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ display: "inline-block" }}>
        <Crest code={team.code} color={team.color} dark={isLightColor(team.color)} size={46} />
      </div>
      <div className="cond" style={{ fontSize: 14, fontWeight: 700, marginTop: 8, color: t.text }}>{team.name.toUpperCase()}</div>
    </div>
  );
}

function FormRow({ t, team }: { t: Theme; team: Team }) {
  const form = recentForm(team.code);
  const col = (r: FormResult) => (r === "W" ? t.win : r === "D" ? t.neutral : t.lose);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <Crest code={team.code} color={team.color} dark={isLightColor(team.color)} size={22} />
      <span className="cond" style={{ flex: 1, fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{team.name}</span>
      <div style={{ display: "flex", gap: 5 }}>
        {form.map((r, i) => (
          <span key={i} style={{ width: 22, height: 22, borderRadius: 6, display: "grid", placeItems: "center", fontSize: 11, fontWeight: 800, color: col(r), background: hex(col(r), 0.16), border: `1px solid ${hex(col(r), 0.4)}` }}>
            {r}
          </span>
        ))}
      </div>
    </div>
  );
}

// The real predictor, rendered then frosted with a premium dark+gold lock — the
// user sees it EXISTS and is right there, just locked. (NOT the old yellow box.)
function LockedPredictor({ t, m }: { t: Theme; m: ApiMatch }) {
  const p = matchPredictor(m);
  const segs = [
    { w: p.home, c: m.home.color, label: m.home.code },
    { w: p.draw, c: t.neutral, label: "Draw" },
    { w: p.away, c: m.away.color, label: m.away.code },
  ];
  return (
    <div style={{ position: "relative", overflow: "hidden", ...card(t) }}>
      {/* Blurred predictor = absolute background; it does NOT set the card height. */}
      <div aria-hidden style={{ position: "absolute", inset: 0, filter: "blur(7px)", opacity: 0.5, pointerEvents: "none", userSelect: "none", padding: "18px 20px" }}>
        <div style={{ display: "flex", height: 14, borderRadius: 7, overflow: "hidden" }}>
          {segs.map((s, i) => <div key={i} style={{ width: `${s.w}%`, background: s.c }} />)}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 9 }}>
          {segs.map((s, i) => (
            <span key={i} className="num" style={{ fontSize: 12, fontWeight: 800, color: t.textDim }}>{s.label} {s.w}%</span>
          ))}
        </div>
        <div style={{ marginTop: 14, fontSize: 12.5, color: t.textDim }}>{p.pick} · predicted {p.scoreline}</div>
      </div>

      {/* Frosted glass + lock content is IN FLOW, so the card sizes to all of it
          (lock → heading → copy → CTA) and nothing gets clipped. */}
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "30px 22px", background: `linear-gradient(160deg, ${hex(t.surfaceHi, 0.5)}, ${hex(t.bg, 0.62)})`, backdropFilter: "blur(3px)" }}>
        <div style={{ display: "inline-grid", placeItems: "center", width: 40, height: 40, borderRadius: "50%", background: hex(t.gold, 0.16), border: `1px solid ${hex(t.gold, 0.4)}`, marginBottom: 11 }}>
          <Lock size={18} color={t.gold} />
        </div>
        <div className="disp" style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Win probability &amp; predictor</div>
        <div style={{ fontSize: 12.5, color: t.textDim, maxWidth: 300, margin: "0 0 16px", lineHeight: 1.5 }}>
          Live win probability and the match predictor are part of the $5 World Cup Bundle.
        </div>
        <Link href="/account" style={{ textDecoration: "none" }}>
          <span style={{ display: "inline-flex", padding: "11px 22px", border: "none", background: t.gold, color: t.bg, fontWeight: 800, fontSize: 13.5, cursor: "pointer", whiteSpace: "nowrap", transform: "skewX(-9deg)" }}>
            <span style={unskew}>Unlock with the bundle <ChevronRight size={14} /></span>
          </span>
        </Link>
      </div>
    </div>
  );
}
