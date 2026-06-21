// Player-profile data: bio, tournament stats, and the paid analysis. Built on
// top of the squad seam so a player's name/position/age/number stay consistent
// with their row on the team page.
//
// BACKEND SEAM: replace every function here with real data (Supabase / a stats
// provider). The Player page reads ONLY from this module. Placeholders are
// deterministic from the player id and position-realistic (a GK shows 0 goals).
import { teamSquad, type Player } from "@/components/design/screens/team/teamData";

export type PlayerStats = { apps: number; minutes: number; goals: number; assists: number; yellow: number; red: number };
export type PlayerProfile = { player: Player; club: string; stats: PlayerStats };
export type PlayerAnalysis = { rating: number; influence: number; impact: string; note: string };

function seed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// Generic placeholder clubs (national-team players play club football). Not real
// clubs — placeholders, replaced by the seam.
const CLUBS = ["Athletic Club", "City FC", "United SC", "Sporting", "Real Valle", "Inter Metro", "Olympic", "Dynamo", "Riverside", "Galaxy SC"];

// BACKEND SEAM: real player bio + tournament stats.
export function getPlayer(id: string): PlayerProfile | null {
  const code = id.split("-")[0];
  const player = teamSquad(code).find((p) => p.id === id);
  if (!player) return null;

  const r = seed(id + "|s");
  const apps = 3 + (r % 5); // 3..7
  const minutes = apps * 70 + (r % 25);
  const goalCap = player.pos === "FW" ? 6 : player.pos === "MF" ? 3 : player.pos === "DF" ? 2 : 0;
  const goals = goalCap === 0 ? 0 : (r >> 3) % (goalCap + 1);
  const assistCap = player.pos === "GK" ? 0 : player.pos === "FW" || player.pos === "MF" ? 3 : 1;
  const assists = assistCap === 0 ? 0 : (r >> 6) % (assistCap + 1);
  const yellow = (r >> 9) % 3; // 0..2
  const red = (r >> 12) % 12 === 0 ? 1 : 0; // rare

  return {
    player,
    club: CLUBS[seed(id + "|c") % CLUBS.length],
    stats: { apps, minutes, goals, assists, yellow, red },
  };
}

// BACKEND SEAM: real model analysis for this player (PAID).
export function playerAnalysis(player: Player): PlayerAnalysis {
  const r = seed(player.id + "|a");
  const rating = (62 + (r % 24)) / 10; // 6.2..8.5
  const influence = 45 + ((r >> 4) % 50); // 45..94
  const impact = influence >= 80 ? "Talisman" : influence >= 62 ? "Key starter" : "Squad rotation";
  return {
    rating,
    influence,
    impact,
    note: `${player.name} rates as a ${impact.toLowerCase()} for this run — full heatmap and projected impact are in the bundle.`,
  };
}
