// Player-profile data: bio, tournament stats, and the paid analysis. Built on
// top of the squad seam so a player's name/position/age/number stay consistent
// with their row on the team page.
//
// BACKEND SEAM: replace every function here with real data (Supabase / a stats
// provider). The Player page reads ONLY from this module. Placeholders are
// deterministic from the player id and position-realistic (a GK shows 0 goals).
import { teamSquad, type Player } from "@/components/design/screens/team/teamData";

export type PlayerStats = {
  apps: number; minutes: number; yellow: number; red: number;
  goals: number; assists: number; // outfield
  saves: number; cleanSheets: number; // goalkeepers
};
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
  const yellow = (r >> 9) % 3; // 0..2
  const red = (r >> 12) % 12 === 0 ? 1 : 0; // rare

  // Position-realistic: keepers get saves/clean sheets (never 12 goals).
  let goals = 0, assists = 0, saves = 0, cleanSheets = 0;
  if (player.isGoalkeeper || player.pos === "GK") {
    saves = apps * 2 + (r % 5); // ~6..19
    cleanSheets = (r >> 3) % (apps + 1); // 0..apps
  } else {
    const goalCap = player.pos === "FWD" ? 6 : player.pos === "MID" ? 3 : 2; // DEF 2
    goals = (r >> 3) % (goalCap + 1);
    const assistCap = player.pos === "FWD" || player.pos === "MID" ? 3 : 1;
    assists = (r >> 6) % (assistCap + 1);
  }

  return {
    player,
    club: CLUBS[seed(id + "|c") % CLUBS.length],
    stats: { apps, minutes, yellow, red, goals, assists, saves, cleanSheets },
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
