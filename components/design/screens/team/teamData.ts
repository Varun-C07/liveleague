// Team-profile data: squad/players and the paid prediction/analysis. (Match
// history comes from the real fixture list, and standing/points from real
// standings — those are NOT faked here.)
//
// BACKEND SEAM: replace every function here with real data (Supabase / a stats
// provider). The Team page reads ONLY from this module. Real rosters for the
// start set live in ./squads.ts; teams without one fall back to a clearly-generic
// placeholder squad (so it's obviously not real until wired).
import { REAL_SQUADS, type Pos } from "./squads";

export type { Pos };
export type Player = {
  id: string;
  name: string;
  pos: Pos;
  number: number;
  age: number;
  isCaptain: boolean;
  isGoalkeeper: boolean;
};
export type TeamAnalysis = { qualifyPct: number; finish: string; titlePct: number; note: string };

function seed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// Ages aren't in the real roster data → derived placeholder (stable per player).
const ageOf = (code: string, number: number) => 19 + (seed(`${code}#${number}`) % 17); // 19..35

// ── generic placeholder squad (teams without a real roster yet) ──────────────
const SURNAMES = [
  "Andersen", "Bauer", "Costa", "Diallo", "Eriksson", "Ferreira", "Garcia", "Horvat",
  "Ibrahim", "Jansen", "Kovac", "Lopez", "Moreau", "Novak", "Okafor", "Perez",
  "Quintero", "Rossi", "Schneider", "Tanaka", "Ueda", "Vargas", "Weber", "Yilmaz",
];
const INITIALS = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "O", "P", "R", "S", "T"];
const GENERIC_SHAPE: Pos[] = [
  "GK", "GK", "GK", "DEF", "DEF", "DEF", "DEF", "DEF", "DEF", "DEF", "DEF",
  "MID", "MID", "MID", "MID", "MID", "MID", "FWD", "FWD", "FWD", "FWD", "FWD",
];

// BACKEND SEAM: real squad list (real rosters from ./squads.ts; generic fallback).
export function teamSquad(code: string): Player[] {
  const real = REAL_SQUADS[code];
  if (real) {
    return real.map((p) => ({
      id: `${code}-${p.number}`,
      name: p.name,
      pos: p.pos,
      number: p.number,
      age: ageOf(code, p.number),
      isCaptain: !!p.isCaptain,
      isGoalkeeper: !!p.isGoalkeeper || p.pos === "GK",
    }));
  }
  const r = seed(code);
  return GENERIC_SHAPE.map((pos, i) => ({
    id: `${code}-${i + 1}`,
    name: `${INITIALS[(r + i * 13) % INITIALS.length]}. ${SURNAMES[(r + i * 7) % SURNAMES.length]}`,
    pos,
    number: i + 1,
    age: ageOf(code, i + 1),
    isCaptain: false,
    isGoalkeeper: pos === "GK",
  }));
}

// BACKEND SEAM: real model prediction / analysis for this team (PAID).
export function teamAnalysis(team: { code: string; name: string; grp: string | null }): TeamAnalysis {
  const r = seed(team.code + "|a");
  const qualifyPct = 35 + (r % 60); // 35..94
  const titlePct = 2 + ((r >> 5) % 22); // 2..23
  const place = 1 + ((r >> 3) % 4);
  const ord = place === 1 ? "1st" : place === 2 ? "2nd" : place === 3 ? "3rd" : "4th";
  const finish = team.grp ? `${ord} in Group ${team.grp}` : "Knockout berth";
  const tier = qualifyPct >= 60 ? "strong favourites" : qualifyPct >= 45 ? "live contenders" : "outsiders";
  return { qualifyPct, finish, titlePct, note: `Model rates ${team.name} ${tier} to reach the knockouts.` };
}
