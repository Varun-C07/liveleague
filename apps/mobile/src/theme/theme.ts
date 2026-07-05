// Obsidian palette — the master theme, mirrored from the web theme.tsx so both
// surfaces share one design language. Single source of truth for color; nothing
// hardcodes hex in screens. Lime accent is SCARCE (primary action + live signal);
// F1 identity is crimson red.
export const colors = {
  bg: "#08090B",
  surface: "#131519",
  surfaceHi: "#1C2027",
  border: "#2A2E37",
  text: "#EEF2F8",
  textDim: "#888F9B",
  textFaint: "#535A66",
  accent: "#B6D335",      // lime — primary action + live signal (scarce)
  onAccent: "#0C0F04",
  live: "#B6D335",        // lime — the live signal is the accent (matches web)
  f1: "#F01E36",          // crimson — Formula 1 identity
  gold: "#F0B429",
  win: "#5BD08A",
  lose: "#FF5C5C",
} as const;

export type Theme = typeof colors;

// Typography tokens. Mono (JetBrains Mono) is reserved for DATA text — times,
// scores, round chips, counts, stat/meta lines — matching the web design. Body,
// titles, and team names stay in the platform sans (system default). Components
// reference these tokens, never the raw font-family string.
export const fonts = {
  mono: "JetBrainsMono_500Medium",
  monoRegular: "JetBrainsMono_400Regular",
} as const;
