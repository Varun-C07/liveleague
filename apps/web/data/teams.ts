import type { Team, TeamCode } from "@/lib/types";

// 48 nations — verified final draw incl. March 2026 playoff winners.
// Preserve every field: emoji flags, colors, group, and API name aliases.
export const TEAMS: Record<TeamCode, Team> = {
  // Group A
  MEX: { name: "Mexico", flag: "🇲🇽", color: "#0a8f4e", grp: "A" },
  RSA: { name: "South Africa", flag: "🇿🇦", color: "#007749", grp: "A", alias: ["South Africa"] },
  KOR: { name: "Korea Republic", flag: "🇰🇷", color: "#cd2e3a", grp: "A", alias: ["South Korea", "Korea Republic"] },
  CZE: { name: "Czechia", flag: "🇨🇿", color: "#4a7fd1", grp: "A", alias: ["Czech Republic"] },
  // Group B
  CAN: { name: "Canada", flag: "🇨🇦", color: "#e8473f", grp: "B" },
  BIH: { name: "Bosnia & Herz.", flag: "🇧🇦", color: "#3b6fd1", grp: "B", alias: ["Bosnia and Herzegovina", "Bosnia & Herzegovina", "Bosnia-Herzegovina"] },
  QAT: { name: "Qatar", flag: "🇶🇦", color: "#8d1b3d", grp: "B" },
  SUI: { name: "Switzerland", flag: "🇨🇭", color: "#d52b1e", grp: "B", alias: ["Switzerland"] },
  // Group C
  BRA: { name: "Brazil", flag: "🇧🇷", color: "#f5d100", grp: "C" },
  MAR: { name: "Morocco", flag: "🇲🇦", color: "#c1272d", grp: "C" },
  HAI: { name: "Haiti", flag: "🇭🇹", color: "#3a64c8", grp: "C" },
  SCO: { name: "Scotland", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", color: "#4a90d9", grp: "C" },
  // Group D
  USA: { name: "USA", flag: "🇺🇸", color: "#2b5cc4", grp: "D", alias: ["United States", "United States of America"] },
  PAR: { name: "Paraguay", flag: "🇵🇾", color: "#d52b1e", grp: "D" },
  AUS: { name: "Australia", flag: "🇦🇺", color: "#0a8f4e", grp: "D" },
  TUR: { name: "Türkiye", flag: "🇹🇷", color: "#e30a17", grp: "D", alias: ["Turkey", "Turkiye"] },
  // Group E
  GER: { name: "Germany", flag: "🇩🇪", color: "#9aa0a6", grp: "E", alias: ["Germany"] },
  CUW: { name: "Curaçao", flag: "🇨🇼", color: "#1f6fd0", grp: "E", alias: ["Curacao"] },
  CIV: { name: "Côte d'Ivoire", flag: "🇨🇮", color: "#f77f00", grp: "E", alias: ["Ivory Coast", "Cote d'Ivoire", "Côte d’Ivoire"] },
  ECU: { name: "Ecuador", flag: "🇪🇨", color: "#f5d100", grp: "E" },
  // Group F
  NED: { name: "Netherlands", flag: "🇳🇱", color: "#ff6200", grp: "F", alias: ["Netherlands", "Holland"] },
  JPN: { name: "Japan", flag: "🇯🇵", color: "#bc002d", grp: "F" },
  SWE: { name: "Sweden", flag: "🇸🇪", color: "#4a90d9", grp: "F", alias: ["Sweden"] },
  TUN: { name: "Tunisia", flag: "🇹🇳", color: "#e70013", grp: "F" },
  // Group G
  BEL: { name: "Belgium", flag: "🇧🇪", color: "#e8b800", grp: "G" },
  EGY: { name: "Egypt", flag: "🇪🇬", color: "#c8102e", grp: "G" },
  IRN: { name: "Iran", flag: "🇮🇷", color: "#239f40", grp: "G", alias: ["IR Iran", "Iran"] },
  NZL: { name: "New Zealand", flag: "🇳🇿", color: "#b8bcc0", grp: "G" },
  // Group H
  ESP: { name: "Spain", flag: "🇪🇸", color: "#c60b1e", grp: "H" },
  CPV: { name: "Cabo Verde", flag: "🇨🇻", color: "#3b6fd1", grp: "H", alias: ["Cape Verde", "Cape Verde Islands"] },
  KSA: { name: "Saudi Arabia", flag: "🇸🇦", color: "#0a8f4e", grp: "H", alias: ["Saudi Arabia"] },
  URU: { name: "Uruguay", flag: "🇺🇾", color: "#5c9fd6", grp: "H" },
  // Group I
  FRA: { name: "France", flag: "🇫🇷", color: "#2b5cc4", grp: "I" },
  SEN: { name: "Senegal", flag: "🇸🇳", color: "#1aa84a", grp: "I" },
  IRQ: { name: "Iraq", flag: "🇮🇶", color: "#cf2c3a", grp: "I" },
  NOR: { name: "Norway", flag: "🇳🇴", color: "#ba0c2f", grp: "I" },
  // Group J
  ARG: { name: "Argentina", flag: "🇦🇷", color: "#6cace4", grp: "J" },
  ALG: { name: "Algeria", flag: "🇩🇿", color: "#0a8f4e", grp: "J", alias: ["Algeria"] },
  AUT: { name: "Austria", flag: "🇦🇹", color: "#ed2939", grp: "J" },
  JOR: { name: "Jordan", flag: "🇯🇴", color: "#3a8f5f", grp: "J" },
  // Group K
  POR: { name: "Portugal", flag: "🇵🇹", color: "#1aa84a", grp: "K" },
  COD: { name: "DR Congo", flag: "🇨🇩", color: "#2b8cff", grp: "K", alias: ["Congo DR", "DR Congo", "Democratic Republic of the Congo", "Congo Democratic Republic"] },
  UZB: { name: "Uzbekistan", flag: "🇺🇿", color: "#1eb53a", grp: "K" },
  COL: { name: "Colombia", flag: "🇨🇴", color: "#fcd116", grp: "K" },
  // Group L
  ENG: { name: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", color: "#cdd2d8", grp: "L" },
  CRO: { name: "Croatia", flag: "🇭🇷", color: "#d10000", grp: "L" },
  GHA: { name: "Ghana", flag: "🇬🇭", color: "#0a8f4e", grp: "L" },
  PAN: { name: "Panama", flag: "🇵🇦", color: "#c8102e", grp: "L" },
};

export function isRealTeam(code: string): boolean {
  return !!TEAMS[code];
}
