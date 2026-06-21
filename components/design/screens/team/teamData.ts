// Team-profile data the app doesn't already have: squad/players and the paid
// prediction/analysis. (Match history comes from the real fixture list, and
// standing/points from real standings — those are NOT faked here.)
//
// BACKEND SEAM: replace every function here with real data (Supabase / a stats
// provider). The Team page reads ONLY from this module. Placeholders are derived
// deterministically from the real team code, so they're stable and never show
// another team's values. Names are generic placeholders (no real-player claims).

export type Player = { id: string; name: string; pos: "GK" | "DF" | "MF" | "FW"; number: number; age: number };
export type TeamAnalysis = { qualifyPct: number; finish: string; titlePct: number; note: string };

function seed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const SURNAMES = [
  "Andersen", "Bauer", "Costa", "Diallo", "Eriksson", "Ferreira", "Garcia", "Horvat",
  "Ibrahim", "Jansen", "Kovac", "Lopez", "Moreau", "Novak", "Okafor", "Perez",
  "Quintero", "Rossi", "Schneider", "Tanaka", "Ueda", "Vargas", "Weber", "Yilmaz",
];
const INITIALS = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "O", "P", "R", "S", "T"];
const SHAPE: Player["pos"][] = [
  "GK", "GK", "GK", "DF", "DF", "DF", "DF", "DF", "DF", "DF", "DF",
  "MF", "MF", "MF", "MF", "MF", "MF", "FW", "FW", "FW", "FW", "FW",
];

// BACKEND SEAM: real squad list.
export function teamSquad(code: string): Player[] {
  const r = seed(code);
  return SHAPE.map((pos, i) => ({
    id: `${code}-${i + 1}`,
    name: `${INITIALS[(r + i * 13) % INITIALS.length]}. ${SURNAMES[(r + i * 7) % SURNAMES.length]}`,
    pos,
    number: i + 1,
    age: 19 + ((r + i * 5) % 17), // 19..35
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
