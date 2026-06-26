// Match-detail data the app doesn't already have: recent form, head-to-head,
// win-probability / predictor, and the "what's at stake" line.
//
// BACKEND SEAM: replace EVERY function here with real data (Supabase / a stats
// provider). The Match page reads ONLY from this module — no fake values live in
// the component. Placeholders are derived deterministically from the real team
// codes, so they're stable and never show wrong-team names.
import type { ApiMatch } from "@/lib/api-shape";

export type FormResult = "W" | "D" | "L";
export type H2HMeeting = { year: string; homeCode: string; awayCode: string; homeScore: number; awayScore: number };
export type Predictor = { home: number; draw: number; away: number; pick: string; scoreline: string };

// Stable hash from a string → deterministic placeholders (no Date/Math.random).
function seed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// BACKEND SEAM: real last-5 form per team.
export function recentForm(teamCode: string): FormResult[] {
  const r = seed(teamCode);
  const out: FormResult[] = [];
  for (let i = 0; i < 5; i++) {
    const v = (r >> (i * 3)) % 3;
    out.push(v === 0 ? "W" : v === 1 ? "D" : "L");
  }
  return out;
}

// BACKEND SEAM: real head-to-head history.
export function headToHead(homeCode: string, awayCode: string): H2HMeeting[] {
  const r = seed(homeCode + awayCode);
  return [2022, 2018, 2014].map((y, i) => {
    const swap = i % 2 === 1;
    return {
      year: String(y),
      homeCode: swap ? awayCode : homeCode,
      awayCode: swap ? homeCode : awayCode,
      homeScore: (r >> (i * 4)) % 4,
      awayScore: (r >> (i * 4 + 2)) % 3,
    };
  });
}

// BACKEND SEAM: real model win-probability + predicted scoreline (PAID).
export function matchPredictor(m: ApiMatch): Predictor {
  const r = seed(m.home.code + "|" + m.away.code);
  let home = 26 + (r % 38);
  let away = 20 + ((r >> 6) % 34);
  let draw = Math.max(8, 100 - home - away);
  const total = home + away + draw;
  home = Math.round((home / total) * 100);
  away = Math.round((away / total) * 100);
  draw = 100 - home - away;
  const fav = home >= away ? m.home.name : m.away.name;
  const a = 1 + (r % 2);
  const b = (r >> 3) % 2;
  return { home, draw, away, pick: `${fav} favoured to take it`, scoreline: `${Math.max(a, b)}–${Math.min(a, b)}` };
}

// BACKEND SEAM: real qualification / standings context.
export function stakesLine(m: ApiMatch): string {
  if (m.grp) return `Group ${m.grp} · three points here would put a Round-of-32 place within reach.`;
  const labels: Record<string, string> = {
    R32: "Round of 32", R16: "Round of 16", QF: "Quarter-final",
    SF: "Semi-final", "3rd Place": "Third-place play-off", Final: "Final",
  };
  return `${labels[m.stage] ?? m.stage} · single-leg knockout — the winner advances, the loser is out.`;
}
