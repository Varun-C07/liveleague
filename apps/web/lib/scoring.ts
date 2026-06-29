// Pure prediction-scoring logic. No I/O, deterministic — unit-tested in tests/.
// Rules: 3 pts for an exact scoreline, 1 pt for the correct outcome (W/D/L),
// else 0.

export type Outcome = "exact" | "result" | "miss";

export function scorePrediction(
  pred: { home: number; away: number },
  actual: { home: number; away: number },
): { points: 0 | 1 | 3; outcome: Outcome } {
  if (pred.home === actual.home && pred.away === actual.away) {
    return { points: 3, outcome: "exact" };
  }
  const predResult = Math.sign(pred.home - pred.away);
  const actualResult = Math.sign(actual.home - actual.away);
  if (predResult === actualResult) return { points: 1, outcome: "result" };
  return { points: 0, outcome: "miss" };
}

export type ScoredPrediction = {
  id: string;
  points: 0 | 1 | 3;
  outcome: Outcome;
  actualHome: number;
  actualAway: number;
};

// Join finished matches with open predictions and compute each one's score.
// Predictions whose match isn't finished are skipped (left unscored).
export function computeScoringBatch(
  finished: { matchId: string; home: number; away: number }[],
  predictions: { id: string; matchId: string; predHome: number; predAway: number }[],
): ScoredPrediction[] {
  const byMatch = new Map(finished.map((f) => [f.matchId, f]));
  const out: ScoredPrediction[] = [];
  for (const p of predictions) {
    const f = byMatch.get(p.matchId);
    if (!f) continue;
    const { points, outcome } = scorePrediction(
      { home: p.predHome, away: p.predAway },
      { home: f.home, away: f.away },
    );
    out.push({ id: p.id, points, outcome, actualHome: f.home, actualAway: f.away });
  }
  return out;
}

// Sum points per user. Used to recompute cached totals (idempotent: derived from
// the full scored set, not incremented).
export function rollupPoints(
  scored: { userId: string; points: number }[],
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const s of scored) {
    totals.set(s.userId, (totals.get(s.userId) ?? 0) + s.points);
  }
  return totals;
}
