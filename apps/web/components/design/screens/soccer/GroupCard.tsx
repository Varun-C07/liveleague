"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "@/components/design/theme";
import { card, hex, Crest } from "@/components/design/primitives";
import { ChevronDown } from "@/components/design/icons";
import { isLightColor } from "@/components/design/map";
import type { StandingRowDto } from "@liveleagues/core/api-shape";
import type { TeamOutlook, OutlookState } from "@liveleagues/core/group-scenarios";

// Group standings card, wired to real /api/soccer/standings rows. `outlook`
// (optional) carries the live qualification verdict per team code.
export function GroupCard({
  g,
  rows,
  favSet,
  outlook,
}: {
  g: string;
  rows: StandingRowDto[];
  favSet: Set<string>;
  outlook?: Record<string, TeamOutlook>;
}) {
  const { t } = useTheme();
  const [open, setOpen] = useState(false);
  const stateColor = (s: OutlookState): string =>
    s === "through" ? t.win : s === "contention" ? t.gold : s === "out" ? t.lose : t.textFaint;
  const hasOutlook = !!outlook && Object.values(outlook).some((o) => o.state !== "alive" || o.line);
  return (
    <div onClick={() => setOpen(!open)} className="lift" style={{ padding: "13px 14px", cursor: "pointer", ...card(t, open ? { ring: hex(t.accent, 0.45) } : {}) }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
        <span className="cond" style={{ fontSize: 14, fontWeight: 700, color: t.textDim, letterSpacing: ".04em" }}>GROUP {g}</span>
        <ChevronDown size={15} color={t.textFaint} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
      </div>
      {rows.map((r, i) => {
        const mine = favSet.has(r.code);
        const o = outlook?.[r.code];
        return (
          <div key={r.code} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderTop: i ? `1px solid ${hex(t.border, 0.5)}` : "none" }}>
            <span className="num" style={{ width: 13, fontSize: 11, fontWeight: 800, color: i < 2 ? t.win : t.textFaint }}>{i + 1}</span>
            {o ? (
              <span title={o.line} style={{ width: 6, height: 6, borderRadius: "50%", background: stateColor(o.state), flexShrink: 0 }} />
            ) : null}
            <Link
              href={`/soccer/team/${r.code}`}
              className="ll-team-link"
              onClick={(e) => e.stopPropagation()}
              style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0, textDecoration: "none", color: mine ? t.accent : t.text }}
            >
              <Crest code={r.code} color={r.color} dark={isLightColor(r.color)} size={20} />
              <span style={{ flex: 1, fontSize: 12.5, fontWeight: mine ? 700 : 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
            </Link>
            <span className="num" style={{ fontSize: 11, color: t.textFaint }}>{r.P}</span>
            <span className="num" style={{ fontSize: 13, fontWeight: 800, minWidth: 16, textAlign: "right" }}>{r.Pts}</span>
          </div>
        );
      })}
      {open && (
        <div className="rise" style={{ marginTop: 10, borderTop: `1px solid ${hex(t.border, 0.5)}`, paddingTop: 10 }}>
          <div style={{ fontSize: 10.5, color: t.textFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 7 }}>W · D · L · GD</div>
          {rows.map((r) => (
            <div key={r.code} style={{ fontSize: 12, color: t.textDim, padding: "3px 0", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ flex: 1, color: t.text }}>{r.name}</span>
              <span className="num">{r.W}·{r.D}·{r.L}</span>
              <span className="num" style={{ minWidth: 26, textAlign: "right", color: r.GD > 0 ? t.win : r.GD < 0 ? t.lose : t.textFaint }}>{r.GD > 0 ? `+${r.GD}` : r.GD}</span>
            </div>
          ))}
          {hasOutlook && (
            <div style={{ marginTop: 11, borderTop: `1px solid ${hex(t.border, 0.5)}`, paddingTop: 9 }}>
              <div style={{ fontSize: 10.5, color: t.textFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 7 }}>Qualification</div>
              {rows.map((r) => {
                const o = outlook?.[r.code];
                if (!o) return null;
                return (
                  <div key={r.code} style={{ fontSize: 11.5, padding: "3px 0", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: stateColor(o.state), flexShrink: 0 }} />
                    <span style={{ width: 38, color: t.textDim, fontWeight: 700 }}>{r.code}</span>
                    <span style={{ flex: 1, color: o.state === "out" ? t.textFaint : t.text }}>{o.line}</span>
                  </div>
                );
              })}
              <div style={{ fontSize: 10, color: t.textFaint, marginTop: 7, lineHeight: 1.5 }}>
                Top 2 advance · best 8 third-placed teams also qualify
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
