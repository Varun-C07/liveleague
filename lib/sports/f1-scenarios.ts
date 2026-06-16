// Pure, deterministic F1 championship math (no fetch) — unit-testable.
// Max points per Grand Prix = 25 (win) + 1 (fastest lap). Sprint max = 8.

export const GP_MAX = 26;
export const SPRINT_MAX = 8;

export function maxPointsRemaining(racesLeft: number, sprintsLeft: number): number {
  return Math.max(0, racesLeft) * GP_MAX + Math.max(0, sprintsLeft) * SPRINT_MAX;
}

// Can a driver on `points` still reach a rival on `targetPoints` given the
// points still available?
export function canReach(points: number, targetPoints: number, remaining: number): boolean {
  return points + remaining >= targetPoints;
}

export function gap(points: number, targetPoints: number): number {
  return Math.max(0, targetPoints - points);
}
