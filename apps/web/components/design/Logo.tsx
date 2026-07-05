"use client";

import Link from "next/link";
import { useTheme } from "@/components/design/theme";
import { Pulse } from "@/components/design/primitives";

// The LiveLeagues wordmark: skewed bar-chart mark + "Live" (white) / "Leagues"
// (accent). Shared by the nav header (DesignShell) and the auth modal so they
// never diverge. `hideWordOnMobile` applies the .ll-logo-word class the header
// uses to drop the wordmark on small screens.
export function BrandMark({
  wordSize = 23,
  hideWordOnMobile = false,
}: {
  wordSize?: number;
  hideWordOnMobile?: boolean;
}) {
  const { t } = useTheme();
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <span style={{ position: "relative", width: 34, height: 30, display: "flex", alignItems: "flex-end", gap: 2.5 }}>
        {[14, 22, 30, 18].map((h, i) => (
          <span key={i} style={{ display: "block", width: 5, height: h, background: i === 2 ? t.accent : t.text, transform: "skewX(-10deg)", borderRadius: 1 }} />
        ))}
        <span style={{ position: "absolute", top: -2, right: -3 }}>
          <Pulse color={t.live} size={6} />
        </span>
      </span>
      <span className={hideWordOnMobile ? "disp ll-logo-word" : "disp"} style={{ fontSize: wordSize, fontWeight: 800, color: t.text, textTransform: "none" }}>
        Live<span style={{ color: t.accent }}>Leagues</span>
      </span>
    </span>
  );
}

// Header logo: the mark wrapped as a home link.
export function Logo() {
  return (
    <Link href="/" aria-label="LiveLeagues home" style={{ cursor: "pointer", textDecoration: "none", display: "inline-flex" }}>
      <BrandMark hideWordOnMobile />
    </Link>
  );
}
