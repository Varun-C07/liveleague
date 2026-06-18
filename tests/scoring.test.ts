import { describe, it, expect } from "vitest";
import {
  scorePrediction,
  computeScoringBatch,
  rollupPoints,
} from "../lib/scoring";

describe("scorePrediction", () => {
  it("exact win => 3 / exact", () => {
    expect(scorePrediction({ home: 2, away: 1 }, { home: 2, away: 1 })).toEqual({
      points: 3,
      outcome: "exact",
    });
  });
  it("exact draw => 3 / exact", () => {
    expect(scorePrediction({ home: 0, away: 0 }, { home: 0, away: 0 })).toEqual({
      points: 3,
      outcome: "exact",
    });
  });
  it("correct outcome, wrong score => 1 / result", () => {
    expect(scorePrediction({ home: 2, away: 0 }, { home: 3, away: 1 })).toEqual({
      points: 1,
      outcome: "result",
    });
  });
  it("correct draw outcome, wrong score => 1 / result", () => {
    expect(scorePrediction({ home: 1, away: 1 }, { home: 2, away: 2 })).toEqual({
      points: 1,
      outcome: "result",
    });
  });
  it("wrong outcome => 0 / miss", () => {
    expect(scorePrediction({ home: 2, away: 1 }, { home: 0, away: 1 })).toEqual({
      points: 0,
      outcome: "miss",
    });
  });
});

describe("computeScoringBatch", () => {
  const finished = [
    { matchId: "soccer-1", home: 2, away: 1 },
    { matchId: "soccer-2", home: 0, away: 0 },
  ];
  const preds = [
    { id: "p1", matchId: "soccer-1", predHome: 2, predAway: 1 }, // exact
    { id: "p2", matchId: "soccer-2", predHome: 1, predAway: 0 }, // wrong (draw vs win)
    { id: "p3", matchId: "soccer-9", predHome: 1, predAway: 1 }, // match not finished
  ];

  it("scores only finished matches", () => {
    const res = computeScoringBatch(finished, preds);
    expect(res.map((r) => r.id)).toEqual(["p1", "p2"]); // p3 skipped
    expect(res[0]).toMatchObject({ id: "p1", points: 3, outcome: "exact" });
    expect(res[1]).toMatchObject({ id: "p2", points: 0, outcome: "miss" });
  });

  it("is idempotent (same input => same output)", () => {
    expect(computeScoringBatch(finished, preds)).toEqual(
      computeScoringBatch(finished, preds),
    );
  });
});

describe("rollupPoints", () => {
  it("sums points per user", () => {
    const totals = rollupPoints([
      { userId: "u1", points: 3 },
      { userId: "u1", points: 1 },
      { userId: "u2", points: 3 },
    ]);
    expect(totals.get("u1")).toBe(4);
    expect(totals.get("u2")).toBe(3);
  });
});
