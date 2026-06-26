import Link from "next/link";
import type { ReactNode } from "react";
import type { Theme } from "@/components/design/theme";
import { card, hex, unskew } from "@/components/design/primitives";
import { Lock, ChevronRight } from "@/components/design/icons";

// The single premium dark+gold "behind glass" lock for every $5 paywall surface
// (NOT the old yellow cross-hatch). The real content (children) renders blurred
// as the background; the lock copy + CTA sit IN FLOW so the panel always sizes to
// its content and is never clipped. CTA routes to the bundle (/account) by default.
export function LockedPanel({
  t,
  title,
  copy,
  ctaLabel = "Unlock with the bundle",
  ctaHref = "/account",
  children,
}: {
  t: Theme;
  title: string;
  copy: string;
  ctaLabel?: string;
  ctaHref?: string;
  children: ReactNode;
}) {
  return (
    <div style={{ position: "relative", overflow: "hidden", ...card(t) }}>
      <div aria-hidden style={{ position: "absolute", inset: 0, filter: "blur(7px)", opacity: 0.5, pointerEvents: "none", userSelect: "none", padding: "18px 20px" }}>
        {children}
      </div>
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "30px 22px", background: `linear-gradient(160deg, ${hex(t.surfaceHi, 0.5)}, ${hex(t.bg, 0.62)})`, backdropFilter: "blur(3px)" }}>
        <div style={{ display: "inline-grid", placeItems: "center", width: 40, height: 40, borderRadius: "50%", background: hex(t.gold, 0.16), border: `1px solid ${hex(t.gold, 0.4)}`, marginBottom: 11 }}>
          <Lock size={18} color={t.gold} />
        </div>
        <div className="disp" style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 12.5, color: t.textDim, maxWidth: 320, margin: "0 0 16px", lineHeight: 1.5 }}>{copy}</div>
        <Link href={ctaHref} style={{ textDecoration: "none" }}>
          <span style={{ display: "inline-flex", padding: "11px 22px", border: "none", background: t.gold, color: t.bg, fontWeight: 800, fontSize: 13.5, cursor: "pointer", whiteSpace: "nowrap", transform: "skewX(-9deg)" }}>
            <span style={unskew}>{ctaLabel} <ChevronRight size={14} /></span>
          </span>
        </Link>
      </div>
    </div>
  );
}
