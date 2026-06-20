"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import type { LiveOverview } from "@/lib/sports/types";
import { useTheme, type Theme } from "@/components/design/theme";
import {
  card, hex, Crest, Tag, Pulse, SL, Strip, unskew,
} from "@/components/design/primitives";
import { Calendar, ChevronDown, ChevronRight } from "@/components/design/icons";
import { mapUpcoming, mapFeatured, mapLeagues, isLightColor, type UpcomingSoccer, type UpcomingF1 } from "@/components/design/map";
import { useOverview } from "@/hooks/useLive";
import { useFavorites } from "@/hooks/useFavorites";
import { splitFavKey } from "@/lib/favorites";
import { TEAMS } from "@/data/teams";

export function Home({ initial }: { initial: LiveOverview }) {
  const { t } = useTheme();
  const { data } = useOverview(initial);
  const ov = data ?? initial;
  const { keys } = useFavorites();
  // Mobile-only accordion: which league bar is expanded (desktop shows cards).
  const [openLeague, setOpenLeague] = useState<string | null>(null);

  const featured = useMemo(() => mapFeatured(ov), [ov]);
  const upcoming = useMemo(() => mapUpcoming(ov, featured?.key), [ov, featured]);
  const leagues = useMemo(() => mapLeagues(ov), [ov]);
  // F1 red kept as a sport identity accent; World Cup uses a muted tone so lime
  // (t.accent) stays reserved for actions + live signals.
  const f1Accent = ov.sports.find((s) => s.id === "f1")?.accent ?? t.crimson;
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
      {/* HERO — collapses to one full-width column when there's no featured card,
          so the headline never sits in a narrow column beside dead space. */}
      <div className="hero" style={featured ? undefined : { gridTemplateColumns: "1fr" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14, flexWrap: "wrap" }}>
            {ov.totalLive > 0 ? (
              <Tag sk color={t.onAccent} bg={t.live}><Pulse color={t.onAccent} size={6} />On now</Tag>
            ) : null}
            <span style={{ fontSize: 12, color: t.textDim, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".12em" }}>The tournament is live</span>
          </div>
          <h1 className="disp h-hero" style={{ fontWeight: 800, lineHeight: 0.92, margin: "0 0 16px" }}>
            Predict the<br />World Cup.<br />Beat your friends.
          </h1>
          <p style={{ fontSize: 15.5, color: t.textDim, maxWidth: 430, margin: "0 0 22px", lineHeight: 1.6 }}>
            Make your picks, run a private league with friends, and follow your teams live —
            World Cup and Formula 1.
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

      {/* UPCOMING — live matches live in the hero above; this is sched-only,
          split into sport subsections (never interleaved), soonest-first. */}
      {upcoming.soccer.length > 0 || upcoming.f1.length > 0 ? (
        <>
          <SL t={t}>Upcoming</SL>

          <SubLabel t={t} color={t.textDim}>World Cup</SubLabel>
          {upcoming.soccer.length > 0 ? (
            <div className="ll-fill">
              {upcoming.soccer.map((u) => <SoccerUpCard key={u.key} u={u} t={t} />)}
            </div>
          ) : (
            <EmptyRow t={t}>No upcoming World Cup matches right now.</EmptyRow>
          )}

          <SubLabel t={t} color={f1Accent}>Formula 1</SubLabel>
          {upcoming.f1.length > 0 ? (
            <div className="ll-fill">
              {upcoming.f1.map((u) => <F1UpCard key={u.key} u={u} t={t} accent={f1Accent} />)}
            </div>
          ) : (
            <EmptyRow t={t}>No upcoming Formula 1 right now.</EmptyRow>
          )}
        </>
      ) : null}

      {/* ALL LEAGUES (WC + F1) — cards on desktop, collapsible bars on mobile */}
      <SL t={t}><Calendar size={15} /> Leagues</SL>
      {/* Desktop: grid of cards */}
      <div className="ll-leagues-cards">
        {leagues.map((l) => (
          <Link key={l.id} href={l.href} className="lift" style={{ textDecoration: "none", color: t.text, cursor: "pointer", padding: 16, position: "relative", overflow: "hidden", display: "block", ...card(t) }}>
            {/* left accent bar carries identity (no corner glyph). F1 keeps its red;
                World Cup uses a muted tone so lime stays reserved for action/live. */}
            <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 4, background: l.id === "f1" ? l.accent : t.textDim }} />
            {l.liveCount > 0 ? (
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
                <Tag sk color={t.onAccent} bg={t.live}><Pulse color={t.onAccent} size={5} />Live</Tag>
              </div>
            ) : null}
            <div className="disp" style={{ fontSize: 24, fontWeight: 800, margin: "0 0 3px" }}>{l.name}</div>
            <div style={{ fontSize: 12, color: t.textDim, marginBottom: 6 }}>{l.total} {l.id === "f1" ? "rounds" : "matches"}</div>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>{l.sub}</div>
          </Link>
        ))}
      </div>
      {/* Mobile: collapsible vertical bars (tap to choose a league) */}
      <div className="ll-leagues-acc">
        {leagues.map((l) => {
          const open = openLeague === l.id;
          return (
            <div key={l.id} className="ll-acc-item" data-open={open} style={{ position: "relative", overflow: "hidden", ...card(t) }}>
              <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 4, background: l.id === "f1" ? l.accent : t.textDim }} />
              <button
                onClick={() => setOpenLeague(open ? null : l.id)}
                aria-expanded={open}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "transparent", border: "none", cursor: "pointer", color: t.text, textAlign: "left" }}
              >
                <span className="disp" style={{ fontSize: 22, fontWeight: 800, flex: 1 }}>{l.name}</span>
                {l.liveCount > 0 ? <Tag sk color={t.onAccent} bg={t.live}><Pulse color={t.onAccent} size={5} />Live</Tag> : null}
                <ChevronDown size={18} color={t.textDim} className="ll-acc-chev" />
              </button>
              <div className="ll-acc-body">
                <div style={{ padding: "0 16px 16px" }}>
                  <div style={{ fontSize: 12, color: t.textDim, marginBottom: 5 }}>{l.total} {l.id === "f1" ? "rounds" : "matches"}</div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 13 }}>{l.sub}</div>
                  <Link href={l.href} style={{ textDecoration: "none" }}>
                    <span style={{ display: "inline-flex", padding: "11px 20px", background: t.accent, color: t.onAccent, fontWeight: 800, fontSize: 13, transform: "skewX(-9deg)" }}>
                      <span style={unskew}>Open {l.name} <ChevronRight size={15} /></span>
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* BUNDLE — premium dark card; gold is a restrained accent, never a fill.
          Contained (not full-bleed) so it reads as one chosen object. */}
      <div style={{ position: "relative", overflow: "hidden", maxWidth: 760, margin: "42px auto 0", borderRadius: 18, background: `linear-gradient(150deg, ${t.surfaceHi}, ${t.surface} 62%)`, border: `1px solid ${hex(t.gold, 0.45)}`, boxShadow: t.shadow, padding: "30px 32px" }}>
        {/* restrained gold corner glow — premium highlight, not a wash */}
        <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `radial-gradient(58% 78% at 100% 0%, ${hex(t.gold, 0.12)}, transparent 60%)` }} />
        <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 28, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div className="disp" style={{ fontSize: 28, fontWeight: 800, margin: "0 0 9px" }}>World Cup Bundle</div>
            <div style={{ fontSize: 13.5, color: t.textDim, lineHeight: 1.6, maxWidth: 440, fontWeight: 500 }}>
              Predict every match, run a private friend league, follow your teams, track who qualifies
              live; one price, the whole tournament.
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 14 }}>
            <div className="disp num" style={{ fontSize: 48, fontWeight: 900, color: t.gold, lineHeight: 0.85 }}>$5</div>
            <Link href="/account" style={{ textDecoration: "none" }}>
              <span style={{ display: "inline-flex", padding: "13px 26px", border: "none", background: t.gold, color: t.bg, fontWeight: 800, fontSize: 15, cursor: "pointer", whiteSpace: "nowrap", transform: "skewX(-9deg)" }}>
                <span style={unskew}>Get the bundle <ChevronRight size={16} /></span>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-section label: sport-colored dot + name, smaller than the main SL header.
function SubLabel({ t, color, children }: { t: Theme; color: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "4px 0 11px" }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <span className="cond" style={{ fontSize: 13, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: t.textDim }}>
        {children}
      </span>
    </div>
  );
}

// Tasteful empty state so a sport with no upcoming items isn't a blank gap.
function EmptyRow({ t, children }: { t: Theme; children: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "15px 16px", borderRadius: 14, border: `1px dashed ${hex(t.border, 0.9)}`, color: t.textDim, fontSize: 13, fontWeight: 500, marginBottom: 30 }}>
      <Calendar size={15} color={t.textFaint} />
      {children}
    </div>
  );
}

// Soccer upcoming card — flags + codes carry it; group label top-left, time top-right, no icon.
function SoccerUpCard({ t, u }: { t: Theme; u: UpcomingSoccer }) {
  return (
    <Link href={u.href} className="lift" style={{ textDecoration: "none", color: t.text, cursor: "pointer", padding: 15, display: "block", ...card(t, u.status === "live" ? { ring: hex(t.live, 0.5) } : {}) }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 13, gap: 8 }}>
        <span style={{ fontSize: 10.5, color: t.textFaint, textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.label}</span>
        {u.status === "live" ? (
          <Tag sk color={t.onAccent} bg={t.live}><Pulse color={t.onAccent} size={5} />{u.when}</Tag>
        ) : (
          <span style={{ fontSize: 12, color: t.textDim, fontWeight: 600, whiteSpace: "nowrap" }}>{u.when}</span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
        <Crest code={u.a.code} color={u.a.color} dark={u.a.dark} size={28} />
        <span className="cond" style={{ fontSize: 13.5, fontWeight: 700 }}>{u.a.code}</span>
        <span style={{ fontSize: 11, color: t.textFaint, fontWeight: 700 }}>{u.score}</span>
        <span className="cond" style={{ fontSize: 13.5, fontWeight: 700 }}>{u.b.code}</span>
        <Crest code={u.b.code} color={u.b.color} dark={u.b.dark} size={28} />
      </div>
    </Link>
  );
}

// F1 upcoming card — round number is the hero element in the red accent, no icon.
function F1UpCard({ t, u, accent }: { t: Theme; u: UpcomingF1; accent: string }) {
  return (
    <Link href={u.href} className="lift" style={{ textDecoration: "none", color: t.text, cursor: "pointer", padding: 15, display: "block", ...card(t, u.status === "live" ? { ring: hex(accent, 0.5) } : {}) }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 9, gap: 8 }}>
        <span className="disp num" style={{ fontSize: 25, fontWeight: 800, color: accent, lineHeight: 1 }}>
          {u.round != null ? `R${u.round}` : "F1"}
        </span>
        {u.status === "live" ? (
          <Tag sk color={t.onAccent} bg={t.live}><Pulse color={t.onAccent} size={5} />{u.when}</Tag>
        ) : (
          <span style={{ fontSize: 12, color: t.textDim, fontWeight: 600, whiteSpace: "nowrap" }}>{u.when}</span>
        )}
      </div>
      <div className="cond" style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.15 }}>{u.name}</div>
      {u.loc ? <div style={{ fontSize: 11, color: t.textDim, marginTop: 3 }}>{u.loc}</div> : null}
    </Link>
  );
}
