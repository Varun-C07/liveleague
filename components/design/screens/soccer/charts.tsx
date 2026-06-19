"use client";

import { useState } from "react";
import type { Theme } from "@/components/design/theme";
import { hex } from "@/components/design/primitives";
import { SAMPLE_MATCH, type SampleTeam } from "@/components/design/screens/soccer/sample";

const SAMPLE_FORM = SAMPLE_MATCH.form;

// Formation (4-3-3 morphing to 3-2-5 in possession). Sample data, badged in
// LiveMatch — kept as an illustrative panel until a paid lineups feed lands.
// (xG-momentum and shot-map panels were removed: no affordable real source.)
export function Formation({ t, H }: { t: Theme; H: SampleTeam }) {
  const [poss, setPoss] = useState(false);
  const [hn, setHn] = useState<number | null>(null);
  const f = poss ? SAMPLE_FORM.poss : SAMPLE_FORM.base;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
        <span style={{ fontSize: 10.5, color: t.textFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>Shape · sample</span>
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
