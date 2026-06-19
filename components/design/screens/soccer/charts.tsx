"use client";

import { useState, type MouseEvent } from "react";
import type { Theme } from "@/components/design/theme";
import { hex, Pulse } from "@/components/design/primitives";
import { SAMPLE_MATCH, type SampleMatch, type SampleTeam } from "@/components/design/screens/soccer/sample";

const SAMPLE_FORM = SAMPLE_MATCH.form;

// ── xG momentum (cumulative xG lines + hover readout) ────────────────────────
export function XgChart({ t, m, A }: { t: Theme; m: SampleMatch; A: SampleTeam }) {
  const W = 320, Hh = 66, maxX = 90, maxY = 2.6;
  const px = (x: number) => (x / maxX) * W;
  const py = (y: number) => Hh - 4 - (y / maxY) * (Hh - 14);
  const line = (pts: number[][]) => pts.map((p, i) => `${i ? "L" : "M"}${px(p[0]).toFixed(1)},${py(p[1]).toFixed(1)}`).join(" ");
  const lastH = m.xgHome[m.xgHome.length - 1], lastA = m.xgAway[m.xgAway.length - 1];
  const area = `${line(m.xgHome)} L${px(lastH[0]).toFixed(1)},${Hh} L0,${Hh} Z`;
  const ns = "non-scaling-stroke";
  const interp = (s: number[][], mn: number) => {
    for (let i = 1; i < s.length; i++) {
      if (s[i][0] >= mn) { const [x0, y0] = s[i - 1], [x1, y1] = s[i]; return y0 + (y1 - y0) * ((mn - x0) / ((x1 - x0) || 1)); }
    }
    return s[s.length - 1][1];
  };
  const [hov, setHov] = useState<number | null>(null);
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const fx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    setHov(Math.min(m.min, fx * maxX));
  };
  const hH = hov != null ? interp(m.xgHome, hov) : null, hA = hov != null ? interp(m.xgAway, hov) : null;
  const hxPct = hov != null ? (hov / maxX) * 100 : 0;
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontSize: 10.5, color: t.textFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".09em", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: t.accent, boxShadow: `0 0 6px ${t.accent}` }} />xG Momentum
        </span>
        <span className="num" style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: ".02em" }}>
          <b style={{ color: t.accent }}>{(hH ?? lastH[1]).toFixed(2)}</b>
          <span style={{ color: t.textFaint, fontWeight: 500 }}> – </span>
          <b style={{ color: t.text }}>{(hA ?? lastA[1]).toFixed(2)}</b>
          {hov != null && <span className="num" style={{ color: t.textFaint, fontWeight: 600, marginLeft: 7, fontSize: 11 }}>{Math.round(hov)}&apos;</span>}
        </span>
      </div>
      <div onMouseMove={onMove} onMouseLeave={() => setHov(null)} style={{ position: "relative", height: Hh, cursor: "crosshair" }}>
        <svg viewBox={`0 0 ${W} ${Hh}`} width="100%" height={Hh} preserveAspectRatio="none" style={{ display: "block", overflow: "visible" }}>
          <defs>
            <linearGradient id="xgfill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={hex(t.accent, 0.32)} />
              <stop offset="100%" stopColor={hex(t.accent, 0)} />
            </linearGradient>
          </defs>
          {[0.65, 1.3, 1.95].map((v, i) => <line key={i} x1="0" y1={py(v)} x2={W} y2={py(v)} stroke={hex(t.border, 0.45)} strokeWidth="1" strokeDasharray="1 5" vectorEffect={ns} />)}
          <line x1="0" y1={Hh - 3} x2={W} y2={Hh - 3} stroke={hex(t.border, 0.9)} strokeWidth="1" vectorEffect={ns} />
          {[15, 30, 45, 60].map((mn) => <line key={mn} x1={px(mn)} y1={Hh - 5} x2={px(mn)} y2={Hh - 1} stroke={hex(t.textFaint, 0.6)} strokeWidth="1" vectorEffect={ns} />)}
          {m.goals.map((g, i) => <line key={i} x1={px(g.m)} y1="2" x2={px(g.m)} y2={Hh - 3} stroke={hex(t.accent, 0.4)} strokeWidth="1" strokeDasharray="2 3" vectorEffect={ns} />)}
          <line x1={px(m.min)} y1="0" x2={px(m.min)} y2={Hh - 3} stroke={hex(t.live, 0.55)} strokeWidth="1" strokeDasharray="3 3" vectorEffect={ns} />
          <path d={area} fill="url(#xgfill)" />
          <path d={line(m.xgAway)} fill="none" stroke={A.c} strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" vectorEffect={ns} />
          <path d={line(m.xgHome)} fill="none" stroke={t.accent} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" vectorEffect={ns} style={{ filter: `drop-shadow(0 1px 4px ${hex(t.accent, 0.5)})` }} />
        </svg>
        {m.goals.map((g, i) => <span key={i} style={{ position: "absolute", left: `${(g.m / maxX) * 100}%`, top: -2, transform: "translateX(-50%)", fontSize: 9 }}>⚽</span>)}
        <span style={{ position: "absolute", left: `${(lastH[0] / maxX) * 100}%`, top: py(lastH[1]) - 4, transform: "translateX(-50%)" }}><Pulse color={t.accent} size={8} /></span>
        {hov != null && (
          <>
            <div style={{ position: "absolute", left: `${hxPct}%`, top: 0, bottom: 3, width: 1, background: hex(t.text, 0.5), pointerEvents: "none" }} />
            <div style={{ position: "absolute", left: `${hxPct}%`, top: py(hH ?? 0) - 4, width: 8, height: 8, borderRadius: "50%", background: t.accent, border: `2px solid ${t.bg}`, transform: "translateX(-50%)", pointerEvents: "none", boxShadow: `0 0 8px ${t.accent}` }} />
          </>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: t.textFaint, fontWeight: 600, marginTop: 2, letterSpacing: ".04em" }}>
        <span>0&apos;</span><span>HT</span><span className="num">{m.min}&apos; LIVE</span>
      </div>
      <div style={{ fontSize: 11, color: t.textDim, marginTop: 7, lineHeight: 1.5 }}>
        Spikes are real chances. Spain&apos;s <b style={{ color: t.accent }}>{lastH[1].toFixed(2)} xG</b> dwarfs Cabo Verde&apos;s {lastA[1].toFixed(2)} — the scoreline is earned.
      </div>
    </div>
  );
}

// ── Formation (4-3-3 morphing to 3-2-5 in possession) ────────────────────────
export function Formation({ t, H }: { t: Theme; H: SampleTeam }) {
  const [poss, setPoss] = useState(false);
  const [hn, setHn] = useState<number | null>(null);
  const f = poss ? SAMPLE_FORM.poss : SAMPLE_FORM.base;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
        <span style={{ fontSize: 10.5, color: t.textFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>Shape · live</span>
        <div style={{ display: "flex", gap: 3, background: t.chip, borderRadius: 7, padding: 3 }}>
          {([["Out of poss.", false], ["In poss.", true]] as [string, boolean][]).map(([l, v]) => (
            <button key={l} onClick={(e) => { e.stopPropagation(); setPoss(v); }} style={{ padding: "4px 10px", borderRadius: 5, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700, background: poss === v ? t.accent : "transparent", color: poss === v ? t.onAccent : t.textDim }}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{ position: "relative", width: "100%", maxWidth: 300, margin: "0 auto", aspectRatio: "16 / 11", background: `linear-gradient(0deg, ${hex(t.accent, 0.07)}, transparent 60%), ${t.surfaceHi}`, borderRadius: 10, overflow: "hidden", boxShadow: `inset 0 0 0 1px ${hex(t.border, 0.5)}` }}>
        <svg viewBox="0 0 100 68.75" width="100%" height="100%" preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }}>
          <rect x="2" y="2" width="96" height="64.75" fill="none" stroke={hex(t.textFaint, 0.35)} strokeWidth=".5" />
          <line x1="2" y1="34.4" x2="98" y2="34.4" stroke={hex(t.textFaint, 0.3)} strokeWidth=".5" />
          <circle cx="50" cy="34.4" r="8" fill="none" stroke={hex(t.textFaint, 0.3)} strokeWidth=".5" />
          <circle cx="50" cy="34.4" r=".8" fill={hex(t.textFaint, 0.5)} />
          <rect x="32" y="2" width="36" height="11" fill="none" stroke={hex(t.textFaint, 0.25)} strokeWidth=".5" />
          <rect x="32" y="55.75" width="36" height="11" fill="none" stroke={hex(t.textFaint, 0.25)} strokeWidth=".5" />
        </svg>
        {f.nodes.map((n, i) => {
          const on = hn === i;
          return (
            <div key={i} onMouseEnter={() => setHn(i)} onMouseLeave={() => setHn(null)} className="num" style={{ position: "absolute", left: `${n[0]}%`, top: `${100 - n[1]}%`, transform: `translate(-50%,-50%) scale(${on ? 1.18 : 1})`, transition: "left .6s cubic-bezier(.5,.1,.3,1), top .6s cubic-bezier(.5,.1,.3,1), transform .18s ease", width: 22, height: 22, borderRadius: "50%", background: H.c, color: H.dark ? "#1a1a1a" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 800, cursor: "pointer", border: `1.5px solid ${hex("#fff", on ? 0.9 : 0.18)}`, boxShadow: on ? `0 4px 12px ${hex("#000", 0.5)}, 0 0 0 4px ${hex(H.c, 0.25)}` : `0 2px 6px ${hex("#000", 0.4)}`, zIndex: on ? 5 : 2 }}>{n[2]}</div>
          );
        })}
      </div>
      <div style={{ fontSize: 11.5, color: t.textDim, marginTop: 8, textAlign: "center" }}>
        <b className="cond" style={{ color: t.text, fontSize: 14 }}>{f.name}</b>
        <span style={{ marginLeft: 6 }}>{poss ? "— full-backs invert, front five stretches the line" : "— compact block, three out wide"}</span>
      </div>
    </div>
  );
}

// ── Shot map ──────────────────────────────────────────────────────────────────
export function ShotMap({ t, m, H, A }: { t: Theme; m: SampleMatch; H: SampleTeam; A: SampleTeam }) {
  const [hv, setHv] = useState<number | null>(null);
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
        <span style={{ fontSize: 10.5, color: t.textFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>Shot map · {m.shots.length} attempts</span>
        <span style={{ fontSize: 9.5, color: t.textFaint, fontWeight: 600, letterSpacing: ".05em", display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ color: A.c }}>◄ {A.n}</span><span style={{ color: t.accent }}>{H.n} ►</span>
        </span>
      </div>
      <div style={{ position: "relative", width: "100%", aspectRatio: "2 / 1", background: `radial-gradient(120% 90% at 78% 50%, ${hex(t.accent, 0.07)}, transparent 55%), radial-gradient(120% 90% at 22% 50%, ${hex(A.c, 0.06)}, transparent 55%), ${t.surfaceHi}`, borderRadius: 10, overflow: "hidden" }}>
        <svg viewBox="0 0 100 50" width="100%" height="100%" preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }}>
          <rect x="1" y="1" width="98" height="48" fill="none" stroke={hex(t.textFaint, 0.3)} strokeWidth=".5" />
          <line x1="50" y1="1" x2="50" y2="49" stroke={hex(t.textFaint, 0.25)} strokeWidth=".5" />
          <circle cx="50" cy="25" r="7" fill="none" stroke={hex(t.textFaint, 0.25)} strokeWidth=".5" />
          <circle cx="50" cy="25" r=".7" fill={hex(t.textFaint, 0.5)} />
          <rect x="1" y="13" width="15" height="24" fill="none" stroke={hex(t.textFaint, 0.22)} strokeWidth=".5" />
          <rect x="84" y="13" width="15" height="24" fill="none" stroke={hex(t.textFaint, 0.22)} strokeWidth=".5" />
        </svg>
        {m.shots.map((s, i) => {
          const col = s.a ? A.c : t.accent; const on = hv === i;
          return <div key={i} onMouseEnter={() => setHv(i)} onMouseLeave={() => setHv(null)} style={{ position: "absolute", left: `${s.x}%`, top: `${s.y}%`, transform: `translate(-50%,-50%) scale(${on ? 1.35 : 1})`, borderRadius: "50%", transition: "transform .15s ease", cursor: "pointer", width: s.g ? 13 : 9, height: s.g ? 13 : 9, background: s.g ? col : hex(col, 0.12), border: `2px solid ${col}`, zIndex: on ? 5 : 2, boxShadow: s.g ? `0 0 10px ${col}, 0 0 3px ${col}` : on ? `0 0 8px ${col}` : "none" }} />;
        })}
        {hv != null && (
          <div style={{ position: "absolute", left: `${m.shots[hv].x}%`, top: `calc(${m.shots[hv].y}% - 16px)`, transform: "translate(-50%,-100%)", background: t.bg, color: t.text, border: `1px solid ${hex(t.border, 0.9)}`, borderRadius: 7, padding: "5px 9px", fontSize: 10.5, fontWeight: 700, whiteSpace: "nowrap", zIndex: 9, boxShadow: t.shadow, pointerEvents: "none", animation: "lltip .12s ease both" }}>
            <span style={{ color: m.shots[hv].g ? t.win : t.textDim }}>{m.shots[hv].g ? "⚽ Goal" : "Shot"}</span>
            <span style={{ color: t.textFaint }}> · </span>{m.shots[hv].a ? A.n : H.n}
          </div>
        )}
      </div>
    </div>
  );
}
