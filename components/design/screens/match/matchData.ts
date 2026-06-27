// Remaining placeholders. Match-page recent form, head-to-head and qualification
// stakes are now REAL (ESPN summary + the group solver) and read off the match
// detail in Match.tsx. The real win-probability model lives in lib/win-prob.ts and
// is served (gated) from /api/soccer/winprob. What's left here:
//  • matchPredictor — the free-tier SAMPLE shown behind the bundle lock for
//    non-entitled users (entitled users get the real model instead).
//  • team-page recent form — used by the Team profile (Team.tsx).
import type { ApiMatch } from "@/lib/api-shape";

export type FormResult = "W" | "D" | "L";
export type Predictor = { home: number; draw: number; away: number; pick: string; scoreline: string };

function seed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// BACKEND SEAM: real last-5 form per team (team-profile context; the match page
// already shows real per-match form from ESPN).
export function recentForm(teamCode: string): FormResult[] {
  const r = seed(teamCode);
  const out: FormResult[] = [];
  for (let i = 0; i < 5; i++) {
    const v = (r >> (i * 3)) % 3;
    out.push(v === 0 ? "W" : v === 1 ? "D" : "L");
  }
  return out;
}

// Free-tier SAMPLE shown behind the bundle lock (deterministic, clearly labelled
// "Sample" in the UI). The real model is lib/win-prob.ts via /api/soccer/winprob.
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
