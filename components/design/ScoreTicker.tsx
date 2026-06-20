"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTheme, type Theme } from "@/components/design/theme";
import { hex, Crest } from "@/components/design/primitives";
import { useLiveTicker } from "@/hooks/useLive";
import { mapTicker, type TickerItem } from "@/components/design/map";

// Thin live-score strip under the nav (every page). Auto-scrolls only when the
// items overflow; pauses on hover; respects prefers-reduced-motion (manual
// scroll instead). Data is the shared ["overview"] query — no new fetch.
export function ScoreTicker() {
  const { t } = useTheme();
  const { data } = useLiveTicker();
  const items = data ? mapTicker(data) : [];

  const wrapRef = useRef<HTMLDivElement>(null);
  const setRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)") ?? null;
    const measure = () => {
      setReduced(!!mq?.matches);
      const w = wrapRef.current?.clientWidth ?? 0;
      const s = setRef.current?.scrollWidth ?? 0;
      setOverflow(s > w + 8);
    };
    measure();
    window.addEventListener("resize", measure);
    mq?.addEventListener?.("change", measure);
    return () => {
      window.removeEventListener("resize", measure);
      mq?.removeEventListener?.("change", measure);
    };
  }, [items.length]);

  if (items.length === 0) return null;

  const animate = overflow && !reduced;
  const dur = Math.max(24, items.length * 6); // slow, premium; constant-ish speed

  return (
    <div
      ref={wrapRef}
      className="lltick-wrap"
      style={{
        background: t.surface,
        borderBottom: `1px solid ${hex(t.border, 0.6)}`,
        overflowX: animate ? "hidden" : overflow ? "auto" : "hidden",
        overflowY: "hidden",
      }}
      aria-label="Live scores"
    >
      <div
        className={animate ? "lltick-track lltick-anim" : "lltick-track"}
        style={
          animate
            ? { width: "max-content", animationDuration: `${dur}s` }
            : { width: "100%", justifyContent: overflow ? "flex-start" : "center" }
        }
      >
        <div ref={setRef} style={{ display: "flex", alignItems: "center" }}>
          {items.map((it) => <TickItem key={it.key} it={it} t={t} />)}
        </div>
        {animate ? (
          <div aria-hidden style={{ display: "flex", alignItems: "center" }}>
            {items.map((it) => <TickItem key={"dup-" + it.key} it={it} t={t} />)}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TickItem({ it, t }: { it: TickerItem; t: Theme }) {
  const live = it.status === "live";
  return (
    <Link
      href={it.href}
      className="lltick-item"
      style={{
        display: "flex", alignItems: "center", gap: 8, height: 42, padding: "0 16px",
        textDecoration: "none", color: t.text, whiteSpace: "nowrap", cursor: "pointer",
        borderRight: `1px solid ${hex(t.border, 0.5)}`, transition: "background .16s ease",
      }}
    >
      {live ? <span style={{ width: 6, height: 6, borderRadius: "50%", background: t.live, flexShrink: 0 }} /> : null}

      {it.sportId === "soccer" && it.a && it.b ? (
        <>
          <Crest code={it.a.code} color={it.a.color} dark={it.a.dark} size={18} />
          <span className="cond" style={{ fontSize: 12.5, fontWeight: 700 }}>{it.a.code}</span>
          <span className="num" style={{ fontSize: 13, fontWeight: 800, color: live ? t.live : t.text }}>{it.score}</span>
          <span className="cond" style={{ fontSize: 12.5, fontWeight: 700 }}>{it.b.code}</span>
          <Crest code={it.b.code} color={it.b.color} dark={it.b.dark} size={18} />
        </>
      ) : (
        <>
          <span className="disp num" style={{ fontSize: 13, fontWeight: 800, color: it.accent }}>
            {it.round != null ? `R${it.round}` : "F1"}
          </span>
          <span className="cond" style={{ fontSize: 12.5, fontWeight: 700, maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis" }}>{it.label}</span>
        </>
      )}

      <span style={{ fontSize: 11, fontWeight: 700, color: live ? t.live : t.textDim }}>{it.detail}</span>
    </Link>
  );
}
