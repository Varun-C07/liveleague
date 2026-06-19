"use client";

import Link from "next/link";
import { useState } from "react";
import { useTheme } from "@/components/design/theme";
import type { Theme } from "@/components/design/theme";
import { card, hex, carbon, unskew, Crest } from "@/components/design/primitives";
import { Plus, Minus, Lock, Check } from "@/components/design/icons";
import { isLightColor, kickoffLabel } from "@/components/design/map";
import { useSubmitPrediction, type Prediction } from "@/hooks/usePredictions";
import type { ApiMatch } from "@/lib/api-shape";

const INK = "#14110A";

const sb = (t: Theme) => ({ width: 24, height: 18, borderRadius: 5, border: "none", background: t.chip, color: t.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 });

function Step({ t, v, up, dn }: { t: Theme; v: number; up: () => void; dn: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <button className="stepbtn" onClick={up} style={sb(t)}><Plus size={12} /></button>
      <span className="disp num" style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.1, margin: "1px 0" }}>{v}</span>
      <button className="stepbtn" onClick={dn} style={sb(t)}><Minus size={12} /></button>
    </div>
  );
}

export function Predict({
  m,
  existing,
  canPredict,
}: {
  m: ApiMatch;
  existing?: Prediction;
  canPredict: boolean;
}) {
  const { t } = useTheme();
  const submit = useSubmitPrediction();
  const locked = !!existing?.locked;
  const [h, setH] = useState(existing?.pred_home ?? 1);
  const [a, setA] = useState(existing?.pred_away ?? 0);
  const step = (set: (n: number) => void, v: number, d: number) => set(Math.max(0, Math.min(9, v + d)));

  const H = m.home, A = m.away;
  const showSteppers = canPredict && !locked;
  const loc = [m.venue, m.city].filter(Boolean).join(" · ");

  return (
    <div style={{ padding: "11px 13px", opacity: canPredict ? 1 : 0.5, ...card(t, locked ? { ring: hex(t.gold, 0.45) } : {}) }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: t.textFaint, marginBottom: 2, textTransform: "uppercase", letterSpacing: ".05em", fontWeight: 700 }}>
        <span>{m.stage}</span><span>{kickoffLabel(m.utc)}</span>
      </div>
      {loc ? <div style={{ fontSize: 10, color: t.textFaint, marginBottom: 9, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{loc}</div> : <div style={{ marginBottom: 9 }} />}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          <Crest code={H.code} color={H.color} dark={isLightColor(H.color)} size={24} />
          <span className="cond" style={{ fontSize: 13.5, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{H.code}</span>
        </div>
        {showSteppers ? (
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Step t={t} v={h} up={() => step(setH, h, 1)} dn={() => step(setH, h, -1)} />
            <span style={{ color: t.textFaint }}>:</span>
            <Step t={t} v={a} up={() => step(setA, a, 1)} dn={() => step(setA, a, -1)} />
          </div>
        ) : (
          <span className="disp num" style={{ fontSize: 20, fontWeight: 800, color: locked ? t.gold : t.textFaint }}>
            {canPredict ? `${h}:${a}` : "?:?"}
          </span>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end", minWidth: 0 }}>
          <span className="cond" style={{ fontSize: 13.5, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{A.code}</span>
          <Crest code={A.code} color={A.color} dark={isLightColor(A.color)} size={24} />
        </div>
      </div>
      {canPredict && (
        <button
          onClick={(e) => { e.stopPropagation(); if (!locked) submit.mutate({ matchId: `soccer-${m.n}`, predHome: h, predAway: a }); }}
          disabled={locked || submit.isPending}
          style={{ marginTop: 11, width: "100%", padding: 9, borderRadius: 8, border: "none", cursor: locked ? "default" : "pointer", fontSize: 12.5, fontWeight: 800, transform: locked ? "none" : "skewX(-9deg)", background: locked ? t.chip : t.accent, color: locked ? t.textDim : t.onAccent, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
        >
          {locked ? (<><Check size={13} />Locked at kickoff</>) : (
            <span style={unskew}><Lock size={13} />{submit.isPending ? "Saving…" : existing ? "Update pick" : "Lock prediction"}</span>
          )}
        </button>
      )}
    </div>
  );
}

export function Paywall() {
  const { t } = useTheme();
  return (
    <div style={{ background: carbon(t.gold), color: INK, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", boxShadow: `inset 0 2px 12px ${hex("#000", 0.16)}, ${t.shadow}` }}>
      <span style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 7 }}>
        <Lock size={14} />Predicting, friend leagues &amp; alerts are part of the $5 bundle.
      </span>
      <Link href="/account" style={{ textDecoration: "none" }}>
        <span style={{ display: "inline-flex", padding: "8px 18px", border: "none", background: INK, color: t.gold, fontWeight: 800, fontSize: 12.5, cursor: "pointer", whiteSpace: "nowrap", transform: "skewX(-9deg)" }}>
          <span style={unskew}>Unlock $5</span>
        </span>
      </Link>
    </div>
  );
}
