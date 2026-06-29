import type { TeamCode } from "@/lib/types";

// Static pre-tournament team strength — approximate public World Football Elo
// ratings (eloratings.net style) transcribed once, the same free-data pattern as
// teams.ts / squads.ts. These are the SEED only: lib/win-prob.ts replays the
// tournament's finished results on top of them so ratings move with real form.
//
// Values are deliberately coarse (nearest ~10) — a win-probability seed, not an
// official ranking. Hosts get no bonus here; home advantage is applied in the
// model (host-only) at prediction time, not baked into the rating.
export const ELO_SEED: Record<TeamCode, number> = {
  // Group A
  MEX: 1800, RSA: 1730, KOR: 1790, CZE: 1810,
  // Group B
  CAN: 1780, BIH: 1780, QAT: 1680, SUI: 1860,
  // Group C
  BRA: 2010, MAR: 1890, HAI: 1560, SCO: 1820,
  // Group D
  USA: 1800, PAR: 1760, AUS: 1720, TUR: 1850,
  // Group E
  GER: 1960, CUW: 1570, CIV: 1790, ECU: 1840,
  // Group F
  NED: 2040, JPN: 1850, SWE: 1780, TUN: 1720,
  // Group G
  BEL: 1930, EGY: 1790, IRN: 1810, NZL: 1600,
  // Group H
  ESP: 2130, CPV: 1590, KSA: 1670, URU: 1900,
  // Group I
  FRA: 2080, SEN: 1870, IRQ: 1660, NOR: 1880,
  // Group J
  ARG: 2140, ALG: 1800, AUT: 1850, JOR: 1640,
  // Group K
  POR: 2010, COD: 1720, UZB: 1700, COL: 1960,
  // Group L
  ENG: 2010, CRO: 1920, GHA: 1750, PAN: 1680,
};

// Fallback for any code without a seed (shouldn't happen for real teams).
export const DEFAULT_ELO = 1700;

// 2026 co-hosts — the only sides that get a home-field bump in the model.
export const HOST_CODES: ReadonlySet<TeamCode> = new Set(["USA", "MEX", "CAN"]);
