"use client";

import { useState } from "react";
import { useTheme } from "@/components/design/theme";
import { card, hex, Crest, Tag, Pulse } from "@/components/design/primitives";
import { MapPin } from "@/components/design/icons";
import { isLightColor, kickoffLabel } from "@/components/design/map";
import { Formation } from "@/components/design/screens/soccer/charts";
import { SAMPLE_MATCH, SAMPLE_H, SAMPLE_A } from "@/components/design/screens/soccer/sample";
import type { ApiMatch } from "@/lib/api-shape";

// Real featured/live match header. The remaining detail panels (formation +
// win-probability) are sample data, clearly badged, until a paid feed lands.
// The xG-momentum and shot-map panels were removed (no affordable real source).
export function LiveMatch({ m }: { m: ApiMatch | null }) {
  const { t } = useTheme();
  const [open, setOpen] = useState(false);
  const sm = SAMPLE_MATCH, H = SAMPLE_H, A = SAMPLE_A;

  if (!m) {
    return (
      <div style={{ padding: "20px 22px", ...card(t) }}>
        <span style={{ fontSize: 13, color: t.textDim }}>No live or upcoming World Cup match right now.</span>
      </div>
    );
  }

  const live = m.status === "live";
  const score = m.status === "sched" ? "vs" : `${m.homeScore ?? 0}–${m.awayScore ?? 0}`;
  const statusLabel = live ? (m.minute ? `${m.minute}'` : "LIVE") : m.status === "ft" ? "FT" : kickoffLabel(m.utc);

  return (
    <div onClick={() => setOpen(!open)} style={{ position: "relative", overflow: "hidden", cursor: "pointer", ...card(t, live ? { ring: hex(t.live, 0.5) } : {}) }}>
      {live && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, overflow: "hidden" }}>
          <div style={{ width: "28%", height: "100%", background: t.live, animation: "llscan 2.6s linear infinite" }} />
        </div>
      )}
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg,${hex(m.home.color, 0.42)},transparent 40%,transparent 60%,${hex(m.away.color, 0.42)})` }} />
      <div style={{ position: "relative", padding: "20px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: t.textDim, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
            <MapPin size={12} />{m.stage} · {m.venue}
          </span>
          {live ? (
            <Tag sk color={t.onAccent} bg={t.live}><Pulse color={t.onAccent} size={5} />{statusLabel}</Tag>
          ) : (
            <span style={{ fontSize: 12, color: t.textDim, fontWeight: 700 }}>{statusLabel}</span>
          )}
        </div>
        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 14, padding: "4px 0" }}>
          <div style={{ position: "absolute", left: 0, top: 6, bottom: 6, width: 6, background: m.home.color, borderRadius: 2 }} />
          <div style={{ position: "absolute", right: 0, top: 6, bottom: 6, width: 6, background: m.away.color, borderRadius: 2 }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ display: "inline-block" }}><Crest code={m.home.code} color={m.home.color} dark={isLightColor(m.home.color)} size={48} /></div>
            <div className="cond" style={{ fontSize: 15, fontWeight: 700, marginTop: 9 }}>{m.home.name}</div>
          </div>
          <div className="disp num" style={{ fontSize: "clamp(34px,8vw,46px)", fontWeight: 800, whiteSpace: "nowrap" }}>{score}</div>
          <div style={{ textAlign: "center" }}>
            <div style={{ display: "inline-block" }}><Crest code={m.away.code} color={m.away.color} dark={isLightColor(m.away.color)} size={48} /></div>
            <div className="cond" style={{ fontSize: 15, fontWeight: 700, marginTop: 9 }}>{m.away.name}</div>
          </div>
        </div>

        {open ? (
          <div className="rise" style={{ marginTop: 16, borderTop: `1px solid ${hex(t.border, 0.6)}`, paddingTop: 15 }}>
            <div style={{ marginBottom: 12 }}>
              <Tag color={t.gold} bg={hex(t.gold, 0.16)}>Sample formation &amp; win-probability · real data arrives with a future data upgrade</Tag>
            </div>
            {/* win probability (sample) */}
            <div style={{ marginBottom: 4 }}>
              <div style={{ display: "flex", height: 8, overflow: "hidden", borderRadius: 4 }}>
                <div style={{ width: `${sm.prob.h}%`, background: t.accent }} />
                <div style={{ width: `${sm.prob.d}%`, background: t.neutral }} />
                <div style={{ width: `${sm.prob.a}%`, background: A.c }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginTop: 7, color: t.textDim, fontWeight: 600 }}>
                <span style={{ color: t.accent }}>{H.n} {sm.prob.h}%</span><span>Draw {sm.prob.d}%</span><span>{A.n} {sm.prob.a}%</span>
              </div>
            </div>
            <Formation t={t} H={H} />
            <div style={{ fontSize: 11, color: t.textFaint, marginTop: 12, textAlign: "center" }}>Tap to collapse</div>
          </div>
        ) : (
          <div style={{ fontSize: 11, color: t.textFaint, marginTop: 12, textAlign: "center" }}>Tap for sample formation &amp; win-probability</div>
        )}
      </div>
    </div>
  );
}
