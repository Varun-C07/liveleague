"use client";

import type { CSSProperties } from "react";
import { motion, useReducedMotion } from "motion/react";

// Restrained, event-driven motion primitives. Every one degrades to a static
// element under prefers-reduced-motion. These fire only for genuinely-live data
// (the caller decides), never on upcoming/static items.

// Soft breathing live dot — the one acceptable subtle loop (~1.5s).
export function LiveDot({ color, size = 6 }: { color: string; size?: number }) {
  const reduce = useReducedMotion();
  const base: CSSProperties = { width: size, height: size, borderRadius: "50%", background: color, flexShrink: 0, display: "inline-block" };
  if (reduce) return <span style={base} />;
  return (
    <motion.span
      style={base}
      animate={{ opacity: [1, 0.35, 1], scale: [1, 1.18, 1] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

// Live minute that flashes briefly (fade-in) each time the value changes.
export function TickingMinute({ value, style }: { value: string; style?: CSSProperties }) {
  const reduce = useReducedMotion();
  if (reduce) return <span style={style}>{value}</span>;
  return (
    <motion.span key={value} initial={{ opacity: 0.3 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, ease: "easeOut" }} style={style}>
      {value}
    </motion.span>
  );
}

// Score that flashes the sport accent (~600ms) when it changes, then settles.
export function FlashScore({ score, accent, settle, style }: { score: string; accent: string; settle: string; style?: CSSProperties }) {
  const reduce = useReducedMotion();
  if (reduce) return <span style={{ color: settle, ...style }}>{score}</span>;
  return (
    <motion.span key={score} initial={{ color: accent }} animate={{ color: settle }} transition={{ duration: 0.6, ease: "easeOut" }} style={style}>
      {score}
    </motion.span>
  );
}

// Faint breathing edge-glow for a card showing a genuinely-live match (~3.2s).
// Inset ring so it shows inside an overflow:hidden card. Caller renders it only
// when live.
export function LiveCardGlow({ color, radius = 14 }: { color: string; radius?: number }) {
  const reduce = useReducedMotion();
  const base: CSSProperties = { position: "absolute", inset: 0, borderRadius: radius, pointerEvents: "none", boxShadow: `inset 0 0 0 1.5px ${color}` };
  if (reduce) return <div aria-hidden style={{ ...base, opacity: 0.7 }} />;
  return (
    <motion.div
      aria-hidden
      style={base}
      animate={{ opacity: [0.4, 0.9, 0.4] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}
