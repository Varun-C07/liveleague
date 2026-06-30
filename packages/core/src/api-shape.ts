import type { MatchStatus } from "./types";

// Normalized contract returned by our Route Handlers. The client never sees
// the upstream key or TheSportsDB's raw shape — only this.

export type TeamRef = {
  code: string;
  name: string;
  flag: string;
  color: string;
  real: boolean; // false for placeholders like "2A" / "W74"
  grp: string | null;
};

export type ApiMatch = {
  n: number;
  stage: string;
  grp: string | null;
  home: TeamRef;
  away: TeamRef;
  venue: string;
  city: string;
  country: string;
  utc: string;
  approx: boolean;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  minute: string | null;
  // Penalty-shootout result for a knockout decided on pens (regulation score stays
  // in home/away). The higher value is the winner. Null when there was no shootout.
  pens: { home: number; away: number } | null;
};

export type DataSource = "live" | "snapshot";

export type MatchesResponse = {
  source: DataSource;
  syncedAt: string; // ISO
  liveCount: number;
  total: number;
  matches: ApiMatch[];
};

export type StandingRowDto = {
  code: string;
  name: string;
  flag: string;
  color: string;
  P: number;
  W: number;
  D: number;
  L: number;
  GF: number;
  GA: number;
  GD: number;
  Pts: number;
};

export type StandingsResponse = {
  source: DataSource;
  syncedAt: string;
  groups: Record<string, StandingRowDto[]>;
  bestThirds: string[];
};
