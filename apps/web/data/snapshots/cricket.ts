import type { Game } from "@liveleague/core/sports/types";
import { fixtureToGame, type Fixture } from "@/lib/sports/snapshotKit";

// Cricket fallback. TheSportsDB/ESPN free cricket coverage is thin, so cricket
// ships snapshot-first for v1 (a small set of internationals). Illustrative.
const FIXTURES: Fixture[] = [
  {
    id: "snap-1",
    status: "final",
    utc: "2026-06-13T09:30:00Z",
    home: ["IND", "India", "#1f6feb"],
    away: ["ENG", "England", "#cf2b34"],
    hs: 287,
    as: 261,
    venue: "Lord's",
    city: "London",
    country: "ENG",
    label: "ODI · Result",
    extra: { sport: "cricket", innings: "2nd", overs: "48.2", note: "India won by 26 runs" },
  },
  {
    id: "snap-2",
    status: "sched",
    utc: "2026-06-15T04:00:00Z",
    home: ["AUS", "Australia", "#f4c430"],
    away: ["NZ", "New Zealand", "#0a0a0a"],
    venue: "MCG",
    city: "Melbourne",
    country: "AUS",
    label: "T20I",
    extra: { sport: "cricket", innings: null, overs: null, note: null },
  },
  {
    id: "snap-3",
    status: "sched",
    utc: "2026-06-16T09:30:00Z",
    home: ["SA", "South Africa", "#157f3b"],
    away: ["PAK", "Pakistan", "#01411c"],
    venue: "Newlands",
    city: "Cape Town",
    country: "RSA",
    label: "Test · Day 1",
    extra: { sport: "cricket", innings: null, overs: null, note: null },
  },
];

export const CRICKET_SNAPSHOT: Game[] = FIXTURES.map((f) => fixtureToGame("cricket", f));
