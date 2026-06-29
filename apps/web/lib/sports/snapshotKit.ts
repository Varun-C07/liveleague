import type { Game, GameExtra, GameStatus, SportId } from "@liveleague/core/sports/types";

// Compact fixture tuple -> Game, for the per-sport offline snapshots.
export type Fixture = {
  id: string;
  status: GameStatus;
  utc: string;
  home: [code: string, name: string, color: string];
  away: [code: string, name: string, color: string];
  hs?: number;
  as?: number;
  venue?: string;
  city?: string;
  country?: string;
  label: string;
  extra: GameExtra;
};

export function fixtureToGame(sport: SportId, f: Fixture): Game {
  return {
    id: `${sport}-${f.id}`,
    sport,
    status: f.status,
    utc: f.utc,
    approx: false,
    venue: f.venue,
    city: f.city,
    country: f.country,
    home: { code: f.home[0], name: f.home[1], color: f.home[2], score: f.hs ?? null, real: true },
    away: { code: f.away[0], name: f.away[1], color: f.away[2], score: f.as ?? null, real: true },
    label: f.label,
    extra: f.extra,
  };
}
