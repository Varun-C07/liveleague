// Shared domain types for the World Cup 2026 board.

export type GroupLetter =
  | "A" | "B" | "C" | "D" | "E" | "F"
  | "G" | "H" | "I" | "J" | "K" | "L";

export type TeamCode = string;

export type Team = {
  name: string;
  flag: string; // emoji
  color: string; // hex, used for color ticks
  grp: GroupLetter;
  alias?: string[]; // alternate names used by the upstream API
};

export type Venue = {
  stadium: string;
  city: string;
  country: string;
};

export type MatchStatus = "sched" | "live" | "ft";

// Compact source tuples (lossless port of the original arrays).
// [n, group, home, away, venueKey, utcISO, homeScore?, awayScore?]
export type GroupMatchTuple =
  | [number, string, string, string, string, string]
  | [number, string, string, string, string, string, number, number];

// [n, stage, home, away, venueKey, utcISO]
export type KnockoutTuple = [number, string, string, string, string, string];

// Fully assembled match used across the app.
export type Match = {
  n: number;
  stage: string; // "Group A" | "R32" | "R16" | "QF" | "SF" | "3rd Place" | "Final"
  grp: GroupLetter | null; // null => knockout
  h: TeamCode;
  a: TeamCode;
  ven: string;
  city: string;
  ctry: string;
  utc: string;
  hs: number | null;
  as: number | null;
  st: MatchStatus;
  approx: boolean; // unconfirmed kickoff time / placeholder
};

export type StandingRow = {
  c: TeamCode;
  P: number;
  W: number;
  D: number;
  L: number;
  GF: number;
  GA: number;
  GD: number;
  Pts: number;
};
