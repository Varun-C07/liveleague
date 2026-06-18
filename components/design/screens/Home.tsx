"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { LiveOverview } from "@/lib/sports/types";
import { useTheme } from "@/components/design/theme";
import {
  card, hex, carbon, Crest, Tag, Pulse, SL, Strip, unskew,
} from "@/components/design/primitives";
import { Calendar, ChevronRight, IconF1, IconSoccer } from "@/components/design/icons";
import { mapSlate, mapFeatured, mapLeagues, isLightColor } from "@/components/design/map";
import { useOverview } from "@/hooks/useLive";
import { useFavorites } from "@/hooks/useFavorites";
import { splitFavKey } from "@/lib/favorites";
import { TEAMS } from "@/data/teams";

const INK = "#14110A";

export function Home({ initial }: { initial: LiveOverview }) {
  const { t } = useTheme();
  const { data } = useOverview(initial);
  const ov = data ?? initial;
  const { keys } = useFavorites();

  const slate = useMemo(() => mapSlate(ov), [ov]);
  const featured = useMemo(() => mapFeatured(ov), [ov]);
  const leagues = useMemo(() => mapLeagues(ov), [ov]);
  const myTeams = useMemo(
    () =>
      keys
        .map(splitFavKey)
        .filter((k): k is { sport: string; code: string } => !!k && k.sport === "soccer")
        .map((k) => ({ code: k.code, team: TEAMS[k.code as keyof typeof TEAMS] }))
        .filter((x) => x.team)
        .slice(0, 8),
    [keys],
  );

  return (
    <div className="rise">
      {/* HERO */}
      <div className="hero">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14, flexWrap: "wrap" }}>
            {ov.totalLive > 0 ? (
              <Tag sk color={t.onAccent} bg={t.live}><Pulse color={t.onAccent} size={6} />On now</Tag>
            ) : null}
            <span style={{ fontSize: 12.5, color: t.textDim, fontWeight: 600 }}>Your sports day</span>
          </div>
          <h1 className="disp h-hero" style={{ fontWeight: 800, lineHeight: 0.92, margin: "0 0 16px" }}>
            Every league<br />that <span style={{ color: t.accent }}>matters.</span><br />One board.
          </h1>
          <p style={{ fontSize: 15.5, color: t.textDim, maxWidth: 430, margin: "0 0 22px", lineHeight: 1.6 }}>
            World Cup and Formula 1 — live scores, predictions and your private leagues, all in one
            place that knows who you follow.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/soccer" style={{ textDecoration: "none" }}>
              <span style={{ display: "inline-flex", padding: "12px 22px", border: "none", background: t.accent, color: t.onAccent, fontWeight: 800, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap", transform: "skewX(-9deg)" }}>
                <span style={unskew}>Open World Cup <ChevronRight size={16} /></span>
              </span>
            </Link>
            <Link href="/f1" style={{ textDecoration: "none" }}>
              <span style={{ display: "inline-flex", padding: "12px 22px", borderRadius: 10, border: `1px solid ${t.border}`, background: t.surface, color: t.text, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                F1 championship
              </span>
            </Link>
          </div>
        </div>

        {/* FEATURED MATCH */}
        {featured ? (
          <Link href={featured.href} className="lift" style={{ textDecoration: "none", color: t.text, cursor: "pointer", position: "relative", overflow: "hidden", display: "block", ...card(t, featured.status === "live" ? { ring: hex(t.live, 0.45) } : {}) }}>
            {featured.status === "live" ? (
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, overflow: "hidden" }}>
                <div style={{ width: "30%", height: "100%", background: t.live, animation: "llscan 2.6s linear infinite" }} />
              </div>
            ) : null}
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg,${hex(featured.home.color, 0.4)},transparent 42%,transparent 58%,${hex(featured.away.color, 0.4)})` }} />
            <div style={{ position: "relative", padding: "22px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
                <span style={{ fontSize: 11, color: t.textDim, fontWeight: 700, letterSpacing: ".05em", whiteSpace: "nowrap", textTransform: "uppercase" }}>{featured.label}</span>
                {featured.status === "live" ? (
                  <Tag sk color={t.onAccent} bg={t.live}><Pulse color={t.onAccent} size={5} />Live {featured.min}</Tag>
                ) : (
                  <span style={{ fontSize: 12, color: t.textDim, fontWeight: 600 }}>{featured.min}</span>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 8 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ display: "inline-block" }}><Crest code={featured.home.code} color={featured.home.color} dark={featured.home.dark} size={50} /></div>
                  <div className="cond" style={{ fontSize: 15, fontWeight: 700, marginTop: 9 }}>{featured.home.name.toUpperCase()}</div>
                </div>
                <div className="disp num" style={{ fontSize: "clamp(34px,8vw,50px)", fontWeight: 800, lineHeight: 1, whiteSpace: "nowrap" }}>{featured.score}</div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ display: "inline-block" }}><Crest code={featured.away.code} color={featured.away.color} dark={featured.away.dark} size={50} /></div>
                  <div className="cond" style={{ fontSize: 15, fontWeight: 700, marginTop: 9 }}>{featured.away.name.toUpperCase()}</div>
                </div>
              </div>
            </div>
          </Link>
        ) : null}
      </div>

      {/* YOUR TEAMS */}
      {myTeams.length > 0 ? (
        <>
          <SL t={t}>Your teams</SL>
          <Strip>
            {myTeams.map(({ code, team }) => (
              <Link key={code} href="/soccer" className="lift" style={{ textDecoration: "none", color: t.text, minWidth: 166, padding: 14, position: "relative", overflow: "hidden", cursor: "pointer", display: "block", ...card(t) }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: team.color }} />
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 11 }}>
                  <Crest code={code} color={team.color} dark={isLightColor(team.color)} size={32} />
                  <span className="cond" style={{ fontWeight: 700, fontSize: 15 }}>{team.name}</span>
                </div>
                <div style={{ fontSize: 12, color: t.textDim, fontWeight: 500 }}>Following</div>
              </Link>
            ))}
          </Strip>
        </>
      ) : null}

      {/* LIVE & UPCOMING */}
      {slate.length > 0 ? (
        <>
          <SL t={t}><Pulse color={t.live} size={7} /> Live &amp; upcoming</SL>
          <Strip>
            {slate.map((s) => (
              <Link key={s.key} href={s.href} className="lift" style={{ textDecoration: "none", color: t.text, minWidth: 206, cursor: "pointer", padding: 15, display: "block", ...card(t, s.status === "live" ? { ring: hex(t.live, 0.5) } : {}) }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 13 }}>
                  <span style={{ fontSize: 19 }}>{s.sport}</span>
                  {s.status === "live" ? (
                    <Tag sk color={t.onAccent} bg={t.live}><Pulse color={t.onAccent} size={5} />{s.min}</Tag>
                  ) : (
                    <span style={{ fontSize: 12, color: t.textDim, fontWeight: 600 }}>{s.min}</span>
                  )}
                </div>
                <div style={{ fontSize: 10.5, color: t.textFaint, marginBottom: 9, textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 700 }}>{s.label}</div>
                {s.a && s.b ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <Crest code={s.a.code} color={s.a.color} dark={s.a.dark} size={28} />
                    <span className="disp num" style={{ fontSize: 22, fontWeight: 800 }}>{s.score}</span>
                    <Crest code={s.b.code} color={s.b.color} dark={s.b.dark} size={28} />
                  </div>
                ) : (
                  <div className="cond" style={{ fontSize: 16, fontWeight: 700 }}>{s.name}</div>
                )}
              </Link>
            ))}
          </Strip>
        </>
      ) : null}

      {/* ALL LEAGUES (WC + F1) */}
      <SL t={t}><Calendar size={15} /> Leagues</SL>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(216px,1fr))", gap: 12 }}>
        {leagues.map((l) => (
          <Link key={l.id} href={l.href} className="lift" style={{ textDecoration: "none", color: t.text, cursor: "pointer", padding: 16, position: "relative", overflow: "hidden", display: "block", ...card(t) }}>
            <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 3, background: l.accent }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ display: "flex", alignItems: "center", height: 30 }}>
                {l.id === "f1" ? <IconF1 size={24} color={l.accent} /> : l.id === "soccer" ? <IconSoccer size={24} color={l.accent} /> : <span style={{ fontSize: 25 }}>{l.emoji}</span>}
              </span>
              {l.liveCount > 0 ? <Tag sk color={t.onAccent} bg={t.live}><Pulse color={t.onAccent} size={5} />Live</Tag> : null}
            </div>
            <div className="disp" style={{ fontSize: 24, fontWeight: 800, margin: "11px 0 3px" }}>{l.name}</div>
            <div style={{ fontSize: 12, color: t.textDim, marginBottom: 6 }}>{l.total} {l.id === "f1" ? "rounds" : "matches"}</div>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>{l.sub}</div>
          </Link>
        ))}
      </div>

      {/* BUNDLE CTA */}
      <div style={{ marginTop: 34, background: carbon(t.gold), color: INK, borderRadius: 16, padding: "28px", boxShadow: `inset 0 2px 14px ${hex("#000", 0.18)}, ${t.shadow}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <div>
          <div className="disp" style={{ fontSize: 32, fontWeight: 800, marginBottom: 6 }}>World Cup Bundle — $5</div>
          <div style={{ fontSize: 13.5, maxWidth: 540, lineHeight: 1.6, opacity: 0.82, fontWeight: 500 }}>
            Predict every match, run a private friend league, follow your teams, track who qualifies
            live — one price, the whole tournament.
          </div>
        </div>
        <Link href="/account" style={{ textDecoration: "none" }}>
          <span style={{ display: "inline-flex", padding: "14px 28px", border: "none", background: INK, color: t.gold, fontWeight: 800, fontSize: 15, cursor: "pointer", whiteSpace: "nowrap", transform: "skewX(-9deg)" }}>
            <span style={unskew}>Get the bundle <ChevronRight size={16} /></span>
          </span>
        </Link>
      </div>
    </div>
  );
}
