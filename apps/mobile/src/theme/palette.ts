// Obsidian-first theme tokens, ported from the web app
// (apps/web/components/design/theme.tsx) so brand stays continuous web↔mobile.
//
// CLAUDE.md rules carried over: Obsidian dark base; the lime `accent` is SCARCE
// (primary CTA + genuine live signal only); F1 = crimson/red, World Cup = accent.
// Shadows are intentionally omitted here — RN shadows differ from the web CSS
// string; add platform shadow styles per-component.

export type Palette = {
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
};

export const PALETTES: Record<string, Palette> = {
  obsidian: {
    name: "Obsidian", scheme: "dark",
    bg: "#08090B", surface: "#131519", surfaceHi: "#1C2027", border: "#2A2E37",
    text: "#EEF2F8", textDim: "#888F9B", textFaint: "#535A66",
    accent: "#B6D335", onAccent: "#0C0F04", live: "#B6D335", crimson: "#F01E36",
    gold: "#F0B429", win: "#5BD08A", lose: "#FF5C5C", neutral: "#5E6675", chip: "#1B1F27",
  },
  broadcast: {
    name: "Broadcast", scheme: "dark",
    bg: "#09090B", surface: "#141417", surfaceHi: "#1E1E23", border: "#2A2A2F",
    text: "#FAFAFA", textDim: "#9A9AA0", textFaint: "#5C5C63",
    accent: "#FF2230", onAccent: "#ffffff", live: "#FF2230", crimson: "#FF2230",
    gold: "#FFC53D", win: "#36D399", lose: "#FF6B6B", neutral: "#6E6E76", chip: "#212126",
  },
};

// Default/master palette. (A PaletteSwitcher + context is a follow-up for Varun.)
export const theme = PALETTES.obsidian;

// Sport identity accent: F1 = crimson, World Cup/soccer = accent (green/lime).
export function sportAccent(sport: string, p: Palette = theme): string {
  return sport === "f1" ? p.crimson : p.accent;
}
