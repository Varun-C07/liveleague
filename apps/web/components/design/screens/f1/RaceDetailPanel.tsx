"use client";

import { useTheme } from "@/components/design/theme";
import type { Theme } from "@/components/design/theme";
import { hex } from "@/components/design/primitives";
import { MapPin, Calendar, Zap } from "@/components/design/icons";
import { useRaceDetail } from "@/hooks/useRaceDetail";
import type { QualiRow, RaceDetail, RaceResultRow } from "@/lib/jolpica-race";

// Rich race center (inside the popup): classification, fastest lap, qualifying
// and a pit-stop summary, all from Jolpica and stored per-round. Built in the
// existing inline-style design language.
export function RaceDetailPanel({ gameId, live }: { gameId: string; live: boolean }) {
  const { t } = useTheme();
  const { detail, loading } = useRaceDetail(gameId, { enabled: true, live });

  if (loading) {
    return <div style={{ padding: 30, fontSize: 13, color: t.textFaint }}>Loading race detail…</div>;
  }
  if (!detail) {
    return <div style={{ padding: 30, fontSize: 13, color: t.textFaint, lineHeight: 1.5 }}>Results aren&apos;t available yet — they appear after the race weekend.</div>;
  }

  return (
    <div style={{ padding: "22px 22px 26px" }}>
      <Header t={t} d={detail} />
      {detail.results.length > 0 ? (
        <Classification t={t} rows={detail.results} fastestCode={detail.fastestLap?.code ?? null} />
      ) : (
        <div style={{ margin: "16px 0", padding: "14px 16px", borderRadius: 12, background: t.surfaceHi, fontSize: 12.5, color: t.textDim }}>
          Race results pending — qualifying is in below.
        </div>
      )}
      {detail.qualifying.length > 0 && <Qualifying t={t} rows={detail.qualifying} />}
      {detail.pitstops.fastest && <Pits t={t} d={detail} />}
    </div>
  );
}

function Label({ t, children }: { t: Theme; children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10.5, color: t.textFaint, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", margin: "22px 0 10px", display: "flex", alignItems: "center", gap: 6 }}>
      {children}
    </div>
  );
}

function Header({ t, d }: { t: Theme; d: RaceDetail }) {
  const fl = d.fastestLap;
  return (
    <div>
      <div style={{ fontSize: 11, color: t.crimson, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em" }}>Round {d.round}</div>
      <h2 className="disp" style={{ fontSize: 28, fontWeight: 800, margin: "4px 0 6px" }}>{d.name ?? "Grand Prix"}</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", fontSize: 12, color: t.textDim, fontWeight: 600 }}>
        {d.circuit && <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><MapPin size={12} />{d.circuit}</span>}
        {d.date && <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Calendar size={12} />{d.date}</span>}
        {fl && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: t.accent }}><Zap size={12} />FL {fl.code} {fl.time}</span>}
      </div>
    </div>
  );
}

function podiumColor(t: Theme, pos: number): string {
  return pos === 1 ? t.gold : pos === 2 ? "#C0C0C0" : pos === 3 ? "#CD7F32" : t.textFaint;
}

function Classification({ t, rows, fastestCode }: { t: Theme; rows: RaceResultRow[]; fastestCode: string | null }) {
  return (
    <div>
      <Label t={t}>🏁 Classification</Label>
      <div style={{ overflow: "hidden", borderRadius: 12, ...{ background: t.surfaceHi } }}>
        {rows.map((r, i) => {
          const delta = r.gained;
          return (
            <div key={r.code + i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 12px", borderTop: i ? `1px solid ${hex(t.border, 0.45)}` : "none" }}>
              <span className="num" style={{ width: 22, textAlign: "center", fontSize: 13.5, fontWeight: 900, color: r.dnf ? t.textFaint : podiumColor(t, r.pos) }}>{r.dnf ? "–" : r.pos}</span>
              <span style={{ width: 4, height: 22, borderRadius: 2, background: r.color, flexShrink: 0 }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                  <span className="num" style={{ color: t.textDim, fontWeight: 800 }}>{r.code}</span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.driver}</span>
                  {fastestCode === r.code && <Zap size={12} color={t.accent} />}
                </div>
                <div style={{ fontSize: 10.5, color: t.textFaint }}>{r.constructor}</div>
              </div>
              {!r.dnf && delta !== 0 && (
                <span className="num" style={{ fontSize: 10.5, fontWeight: 800, color: delta > 0 ? t.win : t.lose }}>{delta > 0 ? `▲${delta}` : `▼${-delta}`}</span>
              )}
              <span className="num" style={{ fontSize: 11, color: t.textDim, minWidth: 56, textAlign: "right" }}>
                {r.dnf ? <span style={{ color: t.lose, fontWeight: 700 }}>{r.status === "Did not start" ? "DNS" : "RET"}</span> : (r.time ?? "—")}
              </span>
              <span className="num" style={{ fontSize: 13, fontWeight: 900, minWidth: 20, textAlign: "right", color: r.points > 0 ? t.text : t.textFaint }}>{r.points}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Qualifying({ t, rows }: { t: Theme; rows: QualiRow[] }) {
  return (
    <div>
      <Label t={t}>⏱ Qualifying</Label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: "4px 16px" }}>
        {rows.map((q) => (
          <div key={q.code + q.pos} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, padding: "3px 0" }}>
            <span className="num" style={{ width: 18, color: t.textFaint, fontWeight: 800 }}>{q.pos}</span>
            <span className="num" style={{ width: 30, fontWeight: 800, color: t.textDim }}>{q.code}</span>
            <span className="num" style={{ flex: 1, textAlign: "right", color: t.text }}>{q.q3 || q.q2 || q.q1 || "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Pits({ t, d }: { t: Theme; d: RaceDetail }) {
  const f = d.pitstops.fastest!;
  return (
    <div>
      <Label t={t}>🛞 Pit stops</Label>
      <div style={{ fontSize: 12, color: t.textDim, marginBottom: 8 }}>
        Fastest: <b className="num" style={{ color: t.text }}>{f.code} {f.duration}s</b> <span style={{ color: t.textFaint }}>(lap {f.lap})</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: "3px 14px" }}>
        {d.pitstops.byDriver.slice(0, 12).map((p) => (
          <div key={p.code} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5 }}>
            <span className="num" style={{ width: 30, fontWeight: 800, color: t.textDim }}>{p.code}</span>
            <span className="num" style={{ flex: 1, textAlign: "right", color: t.textFaint }}>{p.best}s{p.count > 1 ? ` ·${p.count}` : ""}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
