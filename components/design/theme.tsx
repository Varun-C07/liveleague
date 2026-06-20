"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { hex, card } from "@/components/design/primitives";
import { Palette, Check, X } from "@/components/design/icons";

// ── Palette system (ported verbatim from the Claude Design prototype) ────────
export type Theme = {
  name: string;
  scheme: "dark" | "light";
  bg: string;
  surface: string;
  surfaceHi: string;
  border: string;
  text: string;
  textDim: string;
  textFaint: string;
  accent: string;
  onAccent: string;
  live: string;
  crimson: string;
  gold: string;
  win: string;
  lose: string;
  neutral: string;
  chip: string;
  shadow: string;
};

export const PALETTES: Record<string, Theme> = {
  obsidian: {
    name: "Obsidian", scheme: "dark",
    bg: "#08090B", surface: "#131519", surfaceHi: "#1C2027", border: "#2A2E37",
    text: "#EEF2F8", textDim: "#888F9B", textFaint: "#535A66",
    accent: "#B6D335", onAccent: "#0C0F04", live: "#B6D335", crimson: "#F01E36",
    gold: "#F0B429", win: "#5BD08A", lose: "#FF5C5C", neutral: "#5E6675", chip: "#1B1F27",
    shadow: "0 1px 2px rgba(0,0,0,.5), 0 8px 26px rgba(0,0,0,.38)",
  },
  broadcast: {
    name: "Broadcast", scheme: "dark",
    bg: "#09090B", surface: "#141417", surfaceHi: "#1E1E23", border: "#2A2A2F",
    text: "#FAFAFA", textDim: "#9A9AA0", textFaint: "#5C5C63",
    accent: "#FF2230", onAccent: "#ffffff", live: "#FF2230", crimson: "#FF2230",
    gold: "#FFC53D", win: "#36D399", lose: "#FF6B6B", neutral: "#6E6E76", chip: "#212126",
    shadow: "0 1px 2px rgba(0,0,0,.55), 0 8px 26px rgba(0,0,0,.4)",
  },
  terminal: {
    name: "Terminal", scheme: "dark",
    bg: "#0C1016", surface: "#141A22", surfaceHi: "#1D2531", border: "#28313F",
    text: "#E6ECF3", textDim: "#7C8898", textFaint: "#4C5766",
    accent: "#2DD4BF", onAccent: "#04201C", live: "#2DD4BF", crimson: "#FF5247",
    gold: "#FFB22E", win: "#3FD17B", lose: "#FF6B6B", neutral: "#5E6B7D", chip: "#1B2430",
    shadow: "0 1px 2px rgba(0,0,0,.5), 0 8px 26px rgba(0,0,0,.36)",
  },
  ember: {
    name: "Ember", scheme: "dark",
    bg: "#0E0A09", surface: "#1A1310", surfaceHi: "#241A15", border: "#33271F",
    text: "#F7F0E9", textDim: "#A1907F", textFaint: "#5F5247",
    accent: "#FF6B35", onAccent: "#1a0c04", live: "#FF6B35", crimson: "#FF3B30",
    gold: "#F2A93B", win: "#5BD08A", lose: "#FF6B6B", neutral: "#7C6A5C", chip: "#251B15",
    shadow: "0 1px 2px rgba(0,0,0,.5), 0 8px 26px rgba(0,0,0,.4)",
  },
  paper: {
    name: "Paper", scheme: "light",
    bg: "#F3EFE6", surface: "#FFFFFF", surfaceHi: "#FAF6EE", border: "#E5DDCF",
    text: "#181512", textDim: "#6B6358", textFaint: "#9B9286",
    accent: "#2F6E3B", onAccent: "#ffffff", live: "#2F6E3B", crimson: "#C8302E",
    gold: "#B8860B", win: "#1E9E5E", lose: "#C8302E", neutral: "#6E7B72", chip: "#EEE8DC",
    shadow: "0 1px 2px rgba(60,45,25,.06), 0 10px 26px rgba(60,45,25,.09)",
  },
};

export type PaletteKey = keyof typeof PALETTES;
const STORAGE_KEY = "ll:palette";

type ThemeCtx = { pal: string; setPal: (k: string) => void; t: Theme };
const Ctx = createContext<ThemeCtx | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [pal, setPalState] = useState<string>("obsidian");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && PALETTES[saved]) setPalState(saved);
  }, []);

  const setPal = (k: string) => {
    setPalState(k);
    try {
      localStorage.setItem(STORAGE_KEY, k);
    } catch {}
  };

  const t = PALETTES[pal] ?? PALETTES.obsidian;

  const vars: Record<string, string> = {
    "--bg": t.bg,
    "--accent": t.accent,
    "--live": t.live,
    "--crimson": t.crimson,
    "--border": t.border,
    "--glow": hex(t.accent, 0.55),
    "--hovsh": t.shadow,
    "--surfHi": t.surfaceHi,
  };

  return (
    <Ctx.Provider value={{ pal, setPal, t }}>
      <div
        style={{
          background: t.bg,
          color: t.text,
          minHeight: "100vh",
          position: "relative",
          fontFamily: "'Inter',system-ui,sans-serif",
          transition: "background .45s ease,color .45s ease",
          ...vars,
        } as CSSProperties}
      >
        {/* depth: barely-there accent glow anchored to the top corners (reskins
            with the palette) so the near-black canvas reads as lit, not a void */}
        <div
          aria-hidden
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 0,
            background: `radial-gradient(58% 38% at 84% -8%, ${hex(t.accent, t.scheme === "light" ? 0.05 : 0.08)}, transparent 60%), radial-gradient(50% 34% at 6% 2%, ${hex(t.gold, t.scheme === "light" ? 0.035 : 0.05)}, transparent 62%)`,
          }}
        />
        {/* film grain */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 1,
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            backgroundSize: "140px 140px",
            opacity: t.scheme === "light" ? 0.025 : 0.05,
            mixBlendMode: t.scheme === "light" ? "multiply" : "screen",
          }}
        />
        {children}
        <PaletteSwitcher />
      </div>
    </Ctx.Provider>
  );
}

export function useTheme(): ThemeCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useTheme must be used within <ThemeProvider>");
  return c;
}

function PaletteSwitcher() {
  const { pal, setPal, t } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        position: "fixed",
        right: 20,
        bottom: 20,
        zIndex: 80,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 10,
      }}
    >
      {open && (
        <div className="rise" style={{ ...card(t), borderRadius: 16, padding: 14, width: 220 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span className="cond" style={{ fontSize: 13, fontWeight: 700, color: t.textDim, textTransform: "uppercase", letterSpacing: ".06em" }}>
              Theme
            </span>
            <X size={15} color={t.textFaint} style={{ cursor: "pointer" }} onClick={() => setOpen(false)} />
          </div>
          <div style={{ display: "grid", gap: 7 }}>
            {Object.entries(PALETTES).map(([k, p]) => (
              <button
                key={k}
                onClick={() => setPal(k)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
                  borderRadius: 10, cursor: "pointer", textAlign: "left",
                  border: `1.5px solid ${pal === k ? t.accent : "transparent"}`,
                  background: pal === k ? hex(t.accent, 0.1) : t.chip, transition: "all .2s",
                }}
              >
                <span style={{ display: "flex", gap: 3 }}>
                  <span style={{ width: 13, height: 13, borderRadius: "50%", background: p.bg, border: `1px solid ${t.border}` }} />
                  <span style={{ width: 13, height: 13, borderRadius: "50%", background: p.accent }} />
                  <span style={{ width: 13, height: 13, borderRadius: "50%", background: p.gold }} />
                </span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: pal === k ? t.text : t.textDim }}>
                  {p.name}
                </span>
                {pal === k && <Check size={14} color={t.accent} />}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: t.textFaint, marginTop: 10, lineHeight: 1.5 }}>
            Live preview — pick a direction, the whole app reskins instantly.
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: 50, height: 50, borderRadius: "50%", border: "none", cursor: "pointer",
          background: t.accent, color: t.onAccent, boxShadow: "0 8px 26px rgba(0,0,0,.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <Palette size={21} />
      </button>
    </div>
  );
}
