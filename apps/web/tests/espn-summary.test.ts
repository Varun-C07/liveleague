import { describe, it, expect } from "vitest";
import { normalizeSummary } from "../lib/espn-summary";

// Minimal ESPN-summary-shaped fixture exercising every branch of the normalizer.
const SUMMARY = {
  header: {
    competitions: [
      {
        status: { type: { state: "post", detail: "FT" } },
        competitors: [
          { homeAway: "home", score: "2", team: { id: "660", abbreviation: "USA", displayName: "United States" } },
          { homeAway: "away", score: "0", team: { id: "628", abbreviation: "AUS", displayName: "Australia" } },
        ],
      },
    ],
  },
  keyEvents: [
    { clock: { displayValue: "11'" }, type: { type: "own-goal", text: "Own Goal" }, team: { id: "660" }, text: "Own Goal by Cameron Burgess.", participants: [{ athlete: { displayName: "Cameron Burgess" } }] },
    { clock: { displayValue: "16'" }, type: { type: "yellow-card", text: "Yellow Card" }, team: { id: "628" }, text: "Jordan Bos shown a yellow card.", participants: [{ athlete: { displayName: "Jordan Bos" } }] },
    { clock: { displayValue: "45'" }, type: { type: "substitution", text: "Substitution" }, team: { id: "628" }, text: "Sub, Australia.", participants: [{ athlete: { displayName: "Jason Geria" } }] },
    { clock: { displayValue: "24'" }, type: { type: "start-delay", text: "Start Delay" }, text: "Drinks break." },
  ],
  boxscore: {
    teams: [
      { team: { id: "660" }, statistics: [{ name: "possessionPct", value: 61.9 }, { name: "totalShots", value: 10 }, { name: "wonCorners", value: 7 }] },
      { team: { id: "628" }, statistics: [{ name: "possessionPct", value: 38.1 }, { name: "totalShots", value: 3 }, { name: "wonCorners", value: 2 }] },
    ],
  },
  rosters: [
    { team: { id: "660" }, formation: "3-5-2", roster: [
      { starter: true, jersey: "24", athlete: { displayName: "Matt Freese" }, position: { abbreviation: "G" } },
      { starter: false, jersey: "9", athlete: { displayName: "Sub Guy" }, position: { abbreviation: "F" } },
    ] },
    { team: { id: "628" }, formation: "5-4-1", roster: [
      { starter: true, jersey: "18", athlete: { displayName: "Patrick Beach" }, position: { abbreviation: "G" } },
    ] },
  ],
  gameInfo: { venue: { fullName: "Lumen Field" }, attendance: 66925, officials: [{ displayName: "Felix Zwayer" }] },
  lastFiveGames: [
    { team: { id: "660" }, events: [
      { gameDate: "2026-03-28T19:30Z", gameResult: "L", atVs: "vs", homeTeamScore: "2", awayTeamScore: "5", opponent: { abbreviation: "BEL" } },
      { gameDate: "2026-05-31T19:30Z", gameResult: "W", atVs: "@", homeTeamScore: "2", awayTeamScore: "3", opponent: { abbreviation: "SEN" } },
    ] },
    { team: { id: "628" }, events: [
      { gameDate: "2026-03-20T00:00Z", gameResult: "D", atVs: "vs", homeTeamScore: "1", awayTeamScore: "1", opponent: { abbreviation: "JPN" } },
    ] },
  ],
  headToHeadGames: [
    { team: { abbreviation: "USA" }, events: [
      { gameDate: "2025-10-15T01:00Z", homeTeamId: "660", awayTeamId: "628", homeTeamScore: "2", awayTeamScore: "1", opponent: { abbreviation: "AUS" } },
    ] },
  ],
  shootout: [
    { id: "660", team: "United States", shots: [
      { player: "A", shotNumber: 1, didScore: true },
      { player: "B", shotNumber: 2, didScore: false },
      { player: "C", shotNumber: 3, didScore: true },
    ] },
    { id: "628", team: "Australia", shots: [
      { player: "D", shotNumber: 1, didScore: true },
      { player: "E", shotNumber: 2, didScore: false },
      { player: "F", shotNumber: 3, didScore: false },
    ] },
  ],
};

describe("normalizeSummary", () => {
  const d = normalizeSummary(SUMMARY);

  it("reads status + score line by side", () => {
    expect(d.status).toBe("ft");
    expect(d.detail).toBe("FT");
    expect(d.home).toMatchObject({ code: "USA", score: 2 });
    expect(d.away).toMatchObject({ code: "AUS", score: 0 });
  });

  it("keeps only goal/card/sub events and assigns the right side", () => {
    expect(d.events).toHaveLength(3); // the start-delay is dropped
    expect(d.events[0]).toMatchObject({ kind: "goal", side: "home", player: "Cameron Burgess", minute: "11'" });
    expect(d.events[1]).toMatchObject({ kind: "yellow", side: "away", player: "Jordan Bos" });
    expect(d.events[2].kind).toBe("sub");
  });

  it("maps curated stats per side (and skips all-zero rows)", () => {
    const poss = d.stats.find((s) => s.key === "possession");
    expect(poss).toMatchObject({ home: 61.9, away: 38.1, pct: true });
    const shots = d.stats.find((s) => s.key === "shots");
    expect(shots).toMatchObject({ home: 10, away: 3 });
    // fouls were not provided → omitted entirely
    expect(d.stats.find((s) => s.key === "fouls")).toBeUndefined();
  });

  it("builds lineups with formation + starters", () => {
    expect(d.lineups?.home).toMatchObject({ formation: "3-5-2" });
    expect(d.lineups?.home.starters).toHaveLength(1); // only the starter, not the sub
    expect(d.lineups?.home.starters[0]).toMatchObject({ jersey: "24", name: "Matt Freese", pos: "G" });
  });

  it("extracts venue / attendance / referee", () => {
    expect(d.venue).toBe("Lumen Field");
    expect(d.attendance).toBe(66925);
    expect(d.referee).toBe("Felix Zwayer");
  });

  it("builds recent form per side (team perspective, home/away aware)", () => {
    expect(d.form.home).toHaveLength(2);
    expect(d.form.home[0]).toMatchObject({ result: "L", score: "2-5", opp: "BEL" });
    expect(d.form.home[1]).toMatchObject({ result: "W", score: "3-2", opp: "SEN" }); // away game
    expect(d.form.away[0]).toMatchObject({ result: "D", opp: "JPN" });
  });

  it("builds head-to-head with real home/away codes", () => {
    expect(d.h2h).toHaveLength(1);
    expect(d.h2h[0]).toMatchObject({ home: "USA", away: "AUS", score: "2-1" });
  });

  it("normalizes the penalty shootout per side with tallies", () => {
    expect(d.shootout).not.toBeNull();
    expect(d.shootout!.homeScore).toBe(2); // USA scored 2 of 3
    expect(d.shootout!.awayScore).toBe(1); // AUS scored 1 of 3
    expect(d.shootout!.home).toHaveLength(3);
    expect(d.shootout!.home[1]).toMatchObject({ scored: false });
  });
});
