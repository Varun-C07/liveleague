"use client";

import { useEffect, type ReactNode } from "react";
import { useTheme } from "@/components/design/theme";
import { hex } from "@/components/design/primitives";

// Reusable popup with an Apple-style entrance: the backdrop dims + blurs (llfade)
// and the card springs in (llpop, scale .94 → 1 + slight rise) on a snappy
// cubic-bezier. Closes on backdrop click / Esc / the ✕. Body scroll is locked.
export function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  const { t } = useTheme();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "grid",
        placeItems: "center",
        padding: "max(16px, env(safe-area-inset-top)) 16px",
        background: hex("#000", 0.5),
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        animation: "llfade .22s ease both",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          position: "relative",
          width: "min(680px, 100%)",
          maxHeight: "86vh",
          overflowY: "auto",
          borderRadius: 18,
          background: t.surface,
          border: `1px solid ${hex(t.border, 0.7)}`,
          boxShadow: `0 24px 80px ${hex("#000", 0.5)}, ${t.shadow}`,
          animation: "llpop .42s cubic-bezier(.32,.72,0,1) both",
          overscrollBehavior: "contain",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "sticky",
            top: 10,
            float: "right",
            marginRight: 10,
            zIndex: 2,
            width: 30,
            height: 30,
            borderRadius: "50%",
            border: "none",
            cursor: "pointer",
            background: hex(t.textFaint, 0.18),
            color: t.text,
            fontSize: 15,
            fontWeight: 700,
            lineHeight: 1,
            display: "grid",
            placeItems: "center",
          }}
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
