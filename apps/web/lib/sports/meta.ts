import type { SportMeta } from "./types";

// Static, client-safe sport metadata (no fetch logic). Imported by nav, home
// cards and adapters alike. The order here is the display order in the nav.
export const SPORT_META: SportMeta[] = [
  {
    id: "f1",
    name: "Formula 1",
    short: "F1",
    blurb: "Every round of the 2026 calendar — podiums & championship, live.",
    emoji: "🏎️",
    accent: "#ff2a2a",
    accentVar: "--accent-f1",
    basePath: "/f1",
    competitionLabel: "Grand Prix",
  },
  {
    id: "soccer",
    name: "World Cup",
    short: "FIFA",
    blurb: "All 104 matches of the 2026 World Cup with live group tables.",
    emoji: "⚽",
    accent: "#16c060",
    accentVar: "--accent-soccer",
    basePath: "/soccer",
    competitionLabel: "Match",
  },
  {
    id: "nba",
    name: "NBA",
    short: "NBA",
    blurb: "Live NBA scores — quarter, clock and the night's slate.",
    emoji: "🏀",
    accent: "#ff7a18",
    accentVar: "--accent-nba",
    basePath: "/nba",
    competitionLabel: "Game",
  },
  {
    id: "cricket",
    name: "Cricket",
    short: "CRIC",
    blurb: "Live international & league cricket — innings, overs, run rate.",
    emoji: "🏏",
    accent: "#19c7a0",
    accentVar: "--accent-cricket",
    basePath: "/cricket",
    competitionLabel: "Match",
  },
  {
    id: "baseball",
    name: "MLB",
    short: "MLB",
    blurb: "Live MLB scores — inning, base state and the day's games.",
    emoji: "⚾",
    accent: "#4b8bff",
    accentVar: "--accent-baseball",
    basePath: "/baseball",
    competitionLabel: "Game",
  },
];

const BY_ID: Record<string, SportMeta> = Object.fromEntries(SPORT_META.map((s) => [s.id, s]));

export function sportMeta(id: string): SportMeta | undefined {
  return BY_ID[id];
}
