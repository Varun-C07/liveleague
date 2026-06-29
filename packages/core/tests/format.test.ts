import { describe, it, expect } from "vitest";
import { isVersus, liveLabel, scoreText, topGames } from "../src/sports/format";
import type { Game, GameExtra } from "../src/sports/types";

function game(extra: GameExtra, over: Partial<Game> = {}): Game {
  return {
    id: over.id ?? "x",
    sport: extra.sport,
    status: "sched",
    utc: "2026-06-15T12:00:00Z",
    approx: false,
    home: { code: "AAA", name: "A", color: "#000", score: null },
    away: { code: "BBB", name: "B", color: "#000", score: null },
    label: "L",
    extra,
    ...over,
  };
}

describe("isVersus", () => {
  it("is true for team sports and false for F1", () => {
    expect(isVersus(game({ sport: "soccer", grp: null, minute: null, stage: "x" }))).toBe(true);
    expect(isVersus(game({ sport: "f1", round: 1, circuit: "c", sprint: false, podium: null }))).toBe(false);
  });
});

describe("liveLabel", () => {
  it("formats each sport's live detail", () => {
    expect(liveLabel(game({ sport: "soccer", grp: null, minute: "57'", stage: "x" }))).toBe("57'");
    expect(liveLabel(game({ sport: "nba", period: "Q3", clock: "4:12" }))).toBe("Q3 4:12");
    expect(liveLabel(game({ sport: "baseball", inning: "7", half: "top", outs: 2 }))).toBe("▲7");
    expect(liveLabel(game({ sport: "cricket", innings: "2nd", overs: "12.3", note: null }))).toBe("12.3 ov");
    expect(liveLabel(game({ sport: "f1", round: 1, circuit: "c", sprint: false, podium: null }))).toBe("LIVE");
  });
  it("falls back to LIVE when detail is missing", () => {
    expect(liveLabel(game({ sport: "nba", period: null, clock: null }))).toBe("LIVE");
  });
});

describe("scoreText", () => {
  const sx: GameExtra = { sport: "soccer", grp: null, minute: null, stage: "x" };
  it("shows 'v' when not started", () => {
    expect(scoreText(game(sx))).toBe("v");
  });
  it("shows the score once live/final", () => {
    const g = game(sx, { status: "live", home: { code: "A", name: "A", color: "#000", score: 2 }, away: { code: "B", name: "B", color: "#000", score: 1 } });
    expect(scoreText(g)).toBe("2–1");
  });
});

describe("topGames", () => {
  it("orders live first, then soonest upcoming, then most-recent finals", () => {
    const sx = (s: string): GameExtra => ({ sport: "soccer", grp: null, minute: null, stage: s });
    const live = game(sx("live"), { id: "live", status: "live" });
    const soon = game(sx("soon"), { id: "soon", status: "sched", utc: "2026-06-15T13:00:00Z" });
    const later = game(sx("later"), { id: "later", status: "sched", utc: "2026-06-20T13:00:00Z" });
    const fin = game(sx("fin"), { id: "fin", status: "final", utc: "2026-06-10T13:00:00Z" });
    const out = topGames([fin, later, soon, live], 3);
    expect(out.map((g) => g.id)).toEqual(["live", "soon", "later"]);
  });
});
