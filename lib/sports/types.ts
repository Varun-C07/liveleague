// Shared, sport-agnostic shapes. Every sport adapter normalizes its upstream
// feed into these so the home aggregator, ticker, stats and cards stay generic,
// while each sport keeps rich detail in the discriminated `extra` union.

export type SportId = "f1" | "soccer" | "nba" | "cricket" | "baseball";
export type GameStatus = "sched" | "live" | "final";
export type DataSource = "live" | "snapshot";

// Why a bundle looks the way it does — drives honest status labels in the UI:
//   live     = feed reached, has games
//   empty    = feed reached, but no games scheduled right now (NOT an error)
//   fallback = feed unreachable, serving the saved snapshot
//   sample   = snapshot served by design (e.g. cricket, no live feed wired yet)
export type BundleReason = "live" | "empty" | "fallback" | "sample";

// One side of a game (a team, or a placeholder bracket slot).
export type Competitor = {
  code: string; // short code: "USA", "LAL", "IND"
  name: string; // full display name
  logo?: string; // text glyph / emoji flag (safe to render as text)
  logoUrl?: string; // image logo url (rendered as <img>, e.g. ESPN team logos)
  color: string; // accent hex for the color tick
  score: number | null;
  real?: boolean; // false for placeholders like "W74" / "2A"
};

export type Driver = { code: string; color: string };

// Sport-specific payloads. The shared list code never reads these; the
// per-sport row components do.
export type GameExtra =
  | { sport: "soccer"; grp: string | null; minute: string | null; stage: string }
  | { sport: "nba"; period: string | null; clock: string | null }
  | { sport: "baseball"; inning: string | null; half: "top" | "bot" | null; outs: number | null }
  | { sport: "cricket"; innings: string | null; overs: string | null; note: string | null }
  | { sport: "f1"; round: number; circuit: string; sprint: boolean; podium: [Driver, Driver, Driver] | null };

// THE shared shape every adapter produces.
export type Game = {
  id: string; // stable & unique per sport: "soccer-37", "f1-7", "nba-<eventId>"
  sport: SportId;
  status: GameStatus;
  utc: string; // ISO start
  approx: boolean; // unconfirmed kickoff / placeholder
  venue?: string;
  city?: string;
  country?: string;
  home: Competitor;
  away: Competitor;
  label: string; // headline eyebrow: "Group A" | "Round 7 · Spanish GP" | "Final"
  extra: GameExtra;
};

// Generic standings row — each sport fills the metrics it cares about.
export type StandingRow = {
  rank: number;
  code: string;
  name: string;
  color: string;
  logo?: string;
  metrics: { label: string; value: string | number }[];
  group?: string; // group / conference / division bucket
  highlight?: boolean; // qualifying / leading
};

export type LiveBundle = {
  sport: SportId;
  source: DataSource;
  reason?: BundleReason;
  syncedAt: string; // ISO
  liveCount: number;
  games: Game[];
  standings?: StandingRow[];
  standingsTitle?: string;
};

// Static, client-safe metadata. Lives separately (lib/sports/meta.ts) so client
// components can import it without pulling server-only fetch code into the bundle.
export type SportMeta = {
  id: SportId;
  name: string; // "Formula 1"
  short: string; // "F1"
  blurb: string; // one-line tagline
  emoji: string; // icon glyph
  accent: string; // hex (inline-style fallback)
  accentVar: string; // css var, e.g. "--accent-f1"
  basePath: string; // "/f1"
  competitionLabel: string; // "Grand Prix", "Match", "Game"
};

// The adapter contract — one per sport (server-side).
export interface SportAdapter extends SportMeta {
  getLive(live: boolean): Promise<LiveBundle>; // fetch + normalize + fallback
  snapshot(): LiveBundle; // synchronous build-time seed
}

// ---- Home aggregator DTOs ----

export type SportSummary = SportMeta & {
  source: DataSource;
  reason?: BundleReason;
  syncedAt: string;
  liveCount: number;
  total: number;
  topGames: Game[]; // up to 3 most relevant (live first, then next upcoming)
};

export type LiveOverview = {
  syncedAt: string;
  totalLive: number;
  sports: SportSummary[];
};
