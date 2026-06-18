import type { CSSProperties, ReactNode } from "react";
import type { Theme } from "@/components/design/theme";

// ── Style helpers (ported verbatim from the prototype) ───────────────────────
export const hex = (h: string, a: number): string => {
  const n = h.replace("#", "");
  const f = n.length === 3 ? n.split("").map((x) => x + x).join("") : n;
  const r = parseInt(f.slice(0, 2), 16),
    g = parseInt(f.slice(2, 4), 16),
    b = parseInt(f.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
};

// elevation-first card surface
export const card = (
  t: Theme,
  o: { hi?: boolean; ring?: string } = {},
): CSSProperties => ({
  background: o.hi ? t.surfaceHi : t.surface,
  borderRadius: 14,
  boxShadow: o.ring ? `0 0 0 1.5px ${o.ring}, ${t.shadow}` : t.shadow,
  border: t.scheme === "light" && !o.ring ? `1px solid ${t.border}` : "none",
});

export const unskew: CSSProperties = {
  transform: "skewX(9deg)",
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
};

// woven carbon-fibre twill over a base colour
export const carbon = (base: string): string =>
  `repeating-linear-gradient(45deg, rgba(0,0,0,.11) 0 1px, transparent 1px 5px), repeating-linear-gradient(-45deg, rgba(0,0,0,.07) 0 1px, transparent 1px 5px), ${base}`;

// ── Atoms ────────────────────────────────────────────────────────────────────
export function Pulse({ color, size = 8 }: { color: string; size?: number }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: size, height: size }}>
      <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color, opacity: 0.6, animation: "llp 1.8s ease-out infinite" }} />
      <span style={{ position: "relative", width: size, height: size, borderRadius: "50%", background: color }} />
    </span>
  );
}

// A team "crest" — colored disc with the team code. Caller passes the real
// team color (from data/teams.ts) + a `dark` flag for light-on-dark contrast.
export function Crest({
  code,
  color = "#777",
  dark = false,
  size = 36,
}: {
  code: string;
  color?: string;
  dark?: boolean;
  size?: number;
}) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%", background: color,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.36, color: dark ? "#1a1a1a" : "#fff", fontWeight: 800,
        flexShrink: 0, letterSpacing: "-.02em",
      }}
    >
      {code}
    </div>
  );
}

// Tag: skew reserved for live/urgent (sk); eyebrow labels stay straight.
export function Tag({
  color,
  bg,
  sk,
  children,
}: {
  color: string;
  bg: string;
  sk?: boolean;
  children: ReactNode;
}) {
  if (sk)
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10.5, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", padding: "4px 10px", color, background: bg, transform: "skewX(-9deg)", lineHeight: 1 }}>
        <span style={unskew}>{children}</span>
      </span>
    );
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10.5, fontWeight: 800, letterSpacing: ".09em", textTransform: "uppercase", padding: "4px 10px", color, background: bg, borderRadius: 6, lineHeight: 1 }}>
      {children}
    </span>
  );
}

// primary CTA — skew reserved here
export function Cta({
  onClick,
  bg,
  fg,
  children,
  big,
}: {
  onClick?: () => void;
  bg: string;
  fg: string;
  children: ReactNode;
  big?: boolean;
}) {
  return (
    <button onClick={onClick} style={{ padding: big ? "14px 26px" : "12px 22px", border: "none", background: bg, color: fg, fontWeight: 800, fontSize: big ? 15 : 14, cursor: "pointer", whiteSpace: "nowrap", transform: "skewX(-9deg)" }}>
      <span style={unskew}>{children}</span>
    </button>
  );
}
