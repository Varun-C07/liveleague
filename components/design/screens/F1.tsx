"use client";

import { useEffect, useMemo, useState } from "react";
import type { Game, LiveBundle, StandingRow } from "@/lib/sports/types";
import { useTheme } from "@/components/design/theme";
import type { Theme } from "@/components/design/theme";
import { card, hex, Tag, Pulse, SL, Strip } from "@/components/design/primitives";
import { Calendar, MapPin, ChevronDown, Check, Circle } from "@/components/design/icons";
import { useLiveBundle } from "@/hooks/useLive";

const TRACK_AUT = "M22,86 C16,64 24,50 44,48 L150,33 C168,30 176,23 173,15 C170,8 158,9 152,16 L120,46 C104,61 92,66 96,80 C99,90 116,92 138,90 L168,87 C182,85 188,95 181,104 C175,112 156,108 138,107 L52,99 C36,97 27,98 22,86 Z";

type Driver = { pos: number; code: string; name: string; color: string; pts: number; wins: number; gap: number };
type Ctor = { pos: number; code: string; name: string; color: string; pts: number; wins: number; gap: number };
type Race = { round: number; name: string; loc: string; done: boolean; sprint: boolean; next: boolean; live: boolean; podium: { code: string; color: string }[] };

function metric(row: StandingRow, label: string): number {
  const m = row.metrics.find((x) => x.label === label);
  return m ? Number(m.value) || 0 : 0;
}

function mapDrivers(standings: StandingRow[]): Driver[] {
  const leader = standings[0] ? metric(standings[0], "PTS") : 0;
  return standings.map((r) => {
    const pts = metric(r, "PTS");
    return { pos: r.rank, code: r.code, name: r.name, color: r.color, pts, wins: metric(r, "W"), gap: Math.max(0, leader - pts) };
  });
}

function mapCtors(standings: StandingRow[]): Ctor[] {
  const leader = standings[0] ? metric(standings[0], "PTS") : 0;
  return standings.map((r) => {
    const pts = metric(r, "PTS");
    return { pos: r.rank, code: r.code, name: r.name, color: r.color, pts, wins: metric(r, "W"), gap: Math.max(0, leader - pts) };
  });
}

function mapRaces(games: Game[]): Race[] {
  return games
    .filter((g) => g.extra.sport === "f1")
    .map((g) => {
      const ex = g.extra.sport === "f1" ? g.extra : null;
      return {
        round: ex?.round ?? 0,
        name: g.venue || g.label,
        loc: [g.city, g.country].filter(Boolean).join(", "),
        done: g.status === "final",
        sprint: !!ex?.sprint,
        next: false,
        live: g.status === "live",
        podium: (ex?.podium ?? []).map((d) => ({ code: d.code, color: d.color })),
      };
    })
    .sort((a, b) => a.round - b.round);
}

export function F1({ initial }: { initial: LiveBundle }) {
  const { t } = useTheme();
  const { data } = useLiveBundle("f1", initial);
  const bundle = data ?? initial;

  const drivers = useMemo(() => mapDrivers(bundle.standings ?? []), [bundle.standings]);
  const ctors = useMemo(() => mapCtors(bundle.constructorStandings ?? []), [bundle.constructorStandings]);
  const races = useMemo(() => mapRaces(bundle.games), [bundle.games]);
  const [tab, setTab] = useState<"drivers" | "ctors">("drivers");
  const nextRace = useMemo(() => {
    const upcoming = bundle.games.find((g) => g.status !== "final");
    return upcoming ?? null;
  }, [bundle.games]);

  return (
    <div className="rise">
      <div style={{ padding: "32px 0 18px" }}>
        <Tag color={t.crimson} bg={hex(t.crimson, 0.16)}>FIA Formula One 2026</Tag>
        <h1 className="disp h-page" style={{ fontWeight: 800, margin: "14px 0 0" }}>2026 Season // Board</h1>
      </div>

      <NextRace t={t} game={nextRace} />

      <div style={{ marginTop: 26 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          {ctors.length > 0 ? (
            ([["drivers", "Drivers"], ["ctors", "Constructors"]] as [typeof tab, string][]).map(([id, label]) => {
              const on = tab === id;
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  style={{ padding: "7px 15px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em", background: on ? t.crimson : t.chip, color: on ? "#fff" : t.textDim }}
                >
                  {label}
                </button>
              );
            })
          ) : (
            <SL t={t}>Drivers&apos; championship</SL>
          )}
        </div>
        {tab === "ctors" && ctors.length > 0 ? (
          <CtorTable t={t} ctors={ctors} />
        ) : drivers.length > 0 ? (
          <DriverTable t={t} drivers={drivers} />
        ) : (
          <div style={{ padding: "18px 20px", ...card(t) }}>
            <span style={{ fontSize: 13, color: t.textDim }}>Standings load once the season feed is reachable.</span>
          </div>
        )}
      </div>

      <div style={{ marginTop: 28 }}>
        <SL t={t}><Calendar size={15} /> Season calendar
          <span style={{ fontSize: 11, color: t.textFaint, fontWeight: 500, fontStyle: "normal", textTransform: "none", marginLeft: 4 }}>· tap a finished race</span>
        </SL>
        <Strip>{races.map((r) => <RaceNode key={r.round} r={r} t={t} />)}</Strip>
      </div>
    </div>
  );
}

function NextRace({ t, game }: { t: Theme; game: Game | null }) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const target = game ? new Date(game.utc).getTime() : 0;
  const diff = Math.max(0, target - now);
  const dd = Math.floor(diff / 864e5), hh = Math.floor(diff / 36e5) % 24, mm = Math.floor(diff / 6e4) % 60, ss = Math.floor(diff / 1e3) % 60;
  const ex = game && game.extra.sport === "f1" ? game.extra : null;
  return (
    <div style={{ position: "relative", overflow: "hidden", ...card(t, { ring: hex(t.crimson, 0.38) }) }}>
      <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 5, background: t.crimson }} />
      <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid meet" style={{ position: "absolute", right: -6, top: "50%", transform: "translateY(-50%)", height: "150%", opacity: 0.5, pointerEvents: "none" }}>
        <path d={TRACK_AUT} fill="none" stroke={hex(t.crimson, 0.32)} strokeWidth="5" />
        <path d={TRACK_AUT} fill="none" stroke={t.crimson} strokeWidth="1.6" style={{ filter: `drop-shadow(0 0 4px ${hex(t.crimson, 0.8)})` }} />
        <circle r="3" fill="#fff" style={{ filter: `drop-shadow(0 0 5px ${t.crimson})` }}>
          <animateMotion dur="6s" repeatCount="indefinite" path={TRACK_AUT} />
        </circle>
      </svg>
      <div style={{ position: "relative", padding: "22px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11.5, color: t.textDim, textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 700, marginBottom: 6 }}>
            {ex ? `Round ${ex.round} · Next Grand Prix` : "Next Grand Prix"}
          </div>
          <div className="disp" style={{ fontSize: 34, fontWeight: 800 }}>{game?.venue ?? "TBD"}</div>
          <div style={{ fontSize: 13, color: t.textDim, display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <MapPin size={13} />{[game?.city, game?.country].filter(Boolean).join(", ") || "—"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
          {([[dd, "DAYS"], [hh, "HRS"], [mm, "MIN"], [ss, "SEC"]] as [number, string][]).map(([v, l]) => (
            <div key={l} style={{ textAlign: "center", background: hex(t.bg, 0.65), borderRadius: 10, padding: "10px 13px", minWidth: 60, backdropFilter: "blur(2px)" }}>
              <div className="num" style={{ fontSize: 30, fontWeight: 900, color: t.crimson, letterSpacing: ".02em" }}>{String(v).padStart(2, "0")}</div>
              <div style={{ fontSize: 9.5, color: t.textFaint, letterSpacing: ".12em", fontWeight: 700 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DriverTable({ t, drivers }: { t: Theme; drivers: Driver[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const max = drivers[0]?.pts || 1;
  const maxGap = drivers[drivers.length - 1]?.gap || 1;
  return (
    <div style={{ overflow: "hidden", ...card(t) }}>
      {drivers.map((d, i) => {
        const open_ = open === d.code;
        return (
          <div key={d.code} style={{ position: "relative" }}>
            <div className="f1row" onClick={() => setOpen(open_ ? null : d.code)} style={{ display: "flex", alignItems: "center", height: 48, paddingRight: 14, borderTop: i ? `1px solid ${hex(t.border, 0.55)}` : "none", cursor: "pointer", position: "relative", overflow: "hidden", background: open_ ? t.surfaceHi : "transparent" }}>
              {i === 0 && (
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, bottom: 0, width: "22%", background: `linear-gradient(90deg, transparent, ${hex(t.gold, 0.14)}, transparent)`, animation: "llsweep 4.5s ease-in-out infinite" }} />
                </div>
              )}
              <div style={{ width: 5, height: "100%", background: d.color, flexShrink: 0, boxShadow: `0 0 8px ${hex(d.color, 0.6)}` }} />
              <span className="num" style={{ width: 38, textAlign: "center", fontSize: 15, fontWeight: 900, color: i === 0 ? t.gold : t.text }}>{d.pos}</span>
              <div style={{ width: 46, height: 28, background: i === 0 ? t.gold : t.text, color: t.bg, fontWeight: 900, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", transform: "skewX(-13deg)", margin: "0 12px 0 4px", flexShrink: 0, boxShadow: i === 0 ? `0 0 12px ${hex(t.gold, 0.5)}` : "none" }}>
                <span className="num" style={{ transform: "skewX(13deg)", letterSpacing: ".02em" }}>{d.code}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".02em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.name}</div>
              <div style={{ textAlign: "right", marginLeft: 8, minWidth: 62 }}>
                <span className="num" style={{ fontSize: 19, fontWeight: 900, letterSpacing: ".01em" }}>{d.pts}</span>
                <div className="num" style={{ fontSize: 9.5, color: d.gap ? t.textFaint : t.gold, fontWeight: 800, letterSpacing: ".04em" }}>{d.gap ? `+${d.gap}` : "LEADER"}</div>
              </div>
              <ChevronDown size={15} color={t.textFaint} style={{ marginLeft: 10, transform: open_ ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
              <div style={{ position: "absolute", left: 0, bottom: 0, height: 2, width: `${(d.pts / max) * 100}%`, background: `linear-gradient(90deg, ${hex(d.color, 0.2)}, ${d.color})` }} />
            </div>
            {open_ && (
              <div className="rise" style={{ padding: "12px 16px 15px 60px", background: t.surfaceHi, borderTop: `1px solid ${hex(t.border, 0.4)}` }}>
                <div style={{ display: "flex", gap: 18, marginBottom: 11, flexWrap: "wrap" }}>
                  {([["WINS", d.wins], ["POINTS", d.pts], ["GAP", d.gap ? `+${d.gap}` : "—"]] as [string, string | number][]).map(([l, v]) => (
                    <div key={l}><div className="num cond" style={{ fontSize: 17, fontWeight: 800 }}>{v}</div><div style={{ fontSize: 9, color: t.textFaint, fontWeight: 700, letterSpacing: ".08em" }}>{l}</div></div>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 9, color: t.textFaint, fontWeight: 700, letterSpacing: ".06em", width: 46 }}>INTERVAL</span>
                  <div style={{ flex: 1, height: 6, background: t.chip, overflow: "hidden", borderRadius: 3, position: "relative" }}>
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(1 - d.gap / maxGap) * 100}%`, background: d.color, borderRadius: 3 }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CtorTable({ t, ctors }: { t: Theme; ctors: Ctor[] }) {
  const max = ctors[0]?.pts || 1;
  return (
    <div style={{ overflow: "hidden", ...card(t) }}>
      {ctors.map((c, i) => (
        <div key={c.code + i} style={{ position: "relative", display: "flex", alignItems: "center", height: 46, paddingRight: 16, borderTop: i ? `1px solid ${hex(t.border, 0.55)}` : "none" }}>
          <div style={{ width: 5, height: "100%", background: c.color, flexShrink: 0, boxShadow: `0 0 8px ${hex(c.color, 0.6)}` }} />
          <span className="num" style={{ width: 38, textAlign: "center", fontSize: 15, fontWeight: 900, color: i === 0 ? t.gold : t.text }}>{c.pos}</span>
          <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingLeft: 4 }}>{c.name}</div>
          <span className="num" style={{ fontSize: 11, color: t.textFaint, fontWeight: 700, marginRight: 14 }}>{c.wins ? `${c.wins} W` : ""}</span>
          <span className="num" style={{ fontSize: 19, fontWeight: 900, minWidth: 44, textAlign: "right" }}>{c.pts}</span>
          <div style={{ position: "absolute", left: 0, bottom: 0, height: 2, width: `${(c.pts / max) * 100}%`, background: `linear-gradient(90deg, ${hex(c.color, 0.2)}, ${c.color})` }} />
        </div>
      ))}
    </div>
  );
}

function RaceNode({ r, t }: { r: Race; t: Theme }) {
  const [open, setOpen] = useState(false);
  return (
    <div onClick={() => r.done && setOpen(!open)} className="lift" style={{ minWidth: open ? 226 : 144, cursor: r.done ? "pointer" : "default", padding: 13, transition: "min-width .2s", ...card(t, r.live ? { ring: hex(t.crimson, 0.5) } : {}) }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: t.textFaint, fontWeight: 700 }}>R{r.round}{r.sprint ? " · SPR" : ""}</span>
        {r.live ? <Tag sk color="#fff" bg={t.crimson}><Pulse color="#fff" size={5} />Live</Tag> : r.done ? <Check size={14} color={t.win} /> : <Circle size={11} color={t.textFaint} />}
      </div>
      <div className="disp" style={{ fontSize: 17, fontWeight: 800, lineHeight: 1 }}>{r.name}</div>
      <div style={{ fontSize: 11, color: t.textDim, marginTop: 3 }}>{r.loc}</div>
      {open && r.podium.length > 0 && (
        <div className="rise" style={{ marginTop: 11, borderTop: `1px solid ${hex(t.border, 0.5)}`, paddingTop: 10 }}>
          {r.podium.map((p, i) => (
            <div key={p.code} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <span className="num" style={{ fontSize: 11, fontWeight: 800, width: 16, color: i === 0 ? t.gold : i === 1 ? "#C0C0C0" : "#CD7F32" }}>P{i + 1}</span>
              <div style={{ width: 3, height: 14, background: p.color, borderRadius: 2 }} />
              <span className="cond" style={{ fontSize: 13, fontWeight: i === 0 ? 700 : 500 }}>{p.code}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
