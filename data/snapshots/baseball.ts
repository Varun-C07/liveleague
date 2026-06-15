import type { Game } from "@/lib/sports/types";
import { fixtureToGame, type Fixture } from "@/lib/sports/snapshotKit";

// Offline fallback for MLB (mid-June regular season). Illustrative.
const FIXTURES: Fixture[] = [
  {
    id: "snap-1",
    status: "final",
    utc: "2026-06-14T17:05:00Z",
    home: ["NYY", "Yankees", "#0c2340"],
    away: ["BOS", "Red Sox", "#bd3039"],
    hs: 5,
    as: 3,
    venue: "Yankee Stadium",
    city: "New York",
    country: "NY",
    label: "Final",
    extra: { sport: "baseball", inning: "9", half: null, outs: null },
  },
  {
    id: "snap-2",
    status: "sched",
    utc: "2026-06-14T23:10:00Z",
    home: ["LAD", "Dodgers", "#005a9c"],
    away: ["SF", "Giants", "#fd5a1e"],
    venue: "Dodger Stadium",
    city: "Los Angeles",
    country: "CA",
    label: "Scheduled",
    extra: { sport: "baseball", inning: null, half: null, outs: null },
  },
  {
    id: "snap-3",
    status: "sched",
    utc: "2026-06-15T00:10:00Z",
    home: ["CHC", "Cubs", "#0e3386"],
    away: ["STL", "Cardinals", "#c41e3a"],
    venue: "Wrigley Field",
    city: "Chicago",
    country: "IL",
    label: "Scheduled",
    extra: { sport: "baseball", inning: null, half: null, outs: null },
  },
];

export const MLB_SNAPSHOT: Game[] = FIXTURES.map((f) => fixtureToGame("baseball", f));
