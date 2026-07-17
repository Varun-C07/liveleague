import type { Game } from "@liveleagues/core/sports/types";
import { fixtureToGame, type Fixture } from "@/lib/sports/snapshotKit";

// Offline fallback for NBA (June 2026 ≈ NBA Finals). Shown only if the live
// feed is unreachable. Illustrative — no games marked live.
const FIXTURES: Fixture[] = [
  {
    id: "snap-1",
    status: "final",
    utc: "2026-06-12T00:30:00Z",
    home: ["OKC", "Thunder", "#007ac1"],
    away: ["IND", "Pacers", "#fdbb30"],
    hs: 111,
    as: 104,
    venue: "Paycom Center",
    city: "Oklahoma City",
    country: "OK",
    label: "Finals · Game 4",
    extra: { sport: "nba", period: null, clock: null },
  },
  {
    id: "snap-2",
    status: "sched",
    utc: "2026-06-15T00:30:00Z",
    home: ["IND", "Pacers", "#fdbb30"],
    away: ["OKC", "Thunder", "#007ac1"],
    venue: "Gainbridge Fieldhouse",
    city: "Indianapolis",
    country: "IN",
    label: "Finals · Game 5",
    extra: { sport: "nba", period: null, clock: null },
  },
];

export const NBA_SNAPSHOT: Game[] = FIXTURES.map((f) => fixtureToGame("nba", f));
