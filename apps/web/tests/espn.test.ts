import { describe, it, expect } from "vitest";
import { stateToStatus, mapEspnEvent, type EspnEvent } from "@/lib/sports/espn";

describe("stateToStatus", () => {
  it("maps ESPN states to our status", () => {
    expect(stateToStatus("in")).toBe("live");
    expect(stateToStatus("post")).toBe("final");
    expect(stateToStatus("pre")).toBe("sched");
    expect(stateToStatus(undefined)).toBe("sched");
  });
});

const liveEvent: EspnEvent = {
  id: "401",
  date: "2026-06-15T23:30:00Z",
  shortName: "BOS @ LAL",
  competitions: [
    {
      competitors: [
        { homeAway: "home", team: { abbreviation: "LAL", shortDisplayName: "Lakers", color: "552583" }, score: "88" },
        { homeAway: "away", team: { abbreviation: "BOS", shortDisplayName: "Celtics", color: "007A33" }, score: "84" },
      ],
      venue: { fullName: "Crypto.com Arena", address: { city: "Los Angeles", state: "CA" } },
      status: { type: { state: "in", shortDetail: "Q3 4:12" }, period: 3, displayClock: "4:12" },
    },
  ],
};

describe("mapEspnEvent", () => {
  it("normalizes a live event into a Game", () => {
    const g = mapEspnEvent(liveEvent, "nba", ({ status }) => ({
      sport: "nba",
      period: `Q${status?.period}`,
      clock: status?.displayClock ?? null,
    }));
    expect(g).not.toBeNull();
    expect(g!.id).toBe("nba-401");
    expect(g!.status).toBe("live");
    expect(g!.home.code).toBe("LAL");
    expect(g!.home.score).toBe(88);
    expect(g!.home.color).toBe("#552583"); // '#' prefixed
    expect(g!.away.code).toBe("BOS");
    expect(g!.venue).toBe("Crypto.com Arena");
    expect(g!.city).toBe("Los Angeles");
    expect(g!.extra).toEqual({ sport: "nba", period: "Q3", clock: "4:12" });
  });

  it("nulls scores for not-started games", () => {
    const pre: EspnEvent = {
      id: "9",
      date: "2026-06-16T00:00:00Z",
      competitions: [
        {
          competitors: [
            { homeAway: "home", team: { abbreviation: "NYY" }, score: "0" },
            { homeAway: "away", team: { abbreviation: "BOS" }, score: "0" },
          ],
          status: { type: { state: "pre" } },
        },
      ],
    };
    const g = mapEspnEvent(pre, "baseball", () => ({ sport: "baseball", inning: null, half: null, outs: null }));
    expect(g!.status).toBe("sched");
    expect(g!.home.score).toBeNull();
  });

  it("returns null when there is no competition", () => {
    expect(mapEspnEvent({ id: "1" }, "nba", () => ({ sport: "nba", period: null, clock: null }))).toBeNull();
  });
});
