"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "@/components/design/theme";
import { card, hex, Crest, Tag, Pulse } from "@/components/design/primitives";
import { MapPin, ChevronRight } from "@/components/design/icons";
import { isLightColor, kickoffLabel } from "@/components/design/map";
import { PinButton } from "@/components/design/screens/soccer/PinButton";
import type { ApiMatch } from "@/lib/api-shape";

// Real featured/live match card; tap to open the full match center page.
export function LiveMatch({ m }: { m: ApiMatch | null }) {
  const { t } = useTheme();
  const router = useRouter();

  if (!m) {
    return (
      <div style={{ padding: "20px 22px", ...card(t) }}>
        <span style={{ fontSize: 13, color: t.textDim }}>No live or upcoming World Cup match right now.</span>
      </div>
    );
  }

  const live = m.status === "live";
  const score = m.status === "sched" ? "vs" : `${m.homeScore ?? 0}–${m.awayScore ?? 0}`;
  const statusLabel = live ? (m.minute || "LIVE") : m.status === "ft" ? "FT" : kickoffLabel(m.utc);

  return (
    <div onClick={() => router.push(`/soccer/match/${m.n}`)} style={{ position: "relative", overflow: "hidden", cursor: "pointer", ...card(t, live ? { ring: hex(t.live, 0.5) } : {}) }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {live ? (
              <Tag sk color={t.onAccent} bg={t.live}><Pulse color={t.onAccent} size={5} />{statusLabel}</Tag>
            ) : (
              <span style={{ fontSize: 12, color: t.textDim, fontWeight: 700 }}>{statusLabel}</span>
            )}
            <PinButton matchId={`soccer-${m.n}`} />
          </div>
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

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 11, color: t.textFaint, marginTop: 14 }}>
          Open match center <ChevronRight size={13} />
        </div>
      </div>
    </div>
  );
}
