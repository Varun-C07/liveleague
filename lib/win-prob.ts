// Free-data win-probability model: Elo (team strength) → Poisson/Dixon–Coles
// (goals) → W/D/L + most-likely scoreline, with an in-play update from the live
// score and minute. Pure + deterministic (no Date.now — the live minute is an
// input), so it's fully unit-testable. NOT a trained model and NOT official odds:
// a transparent, clearly-labelled approximation per the project's data rules.

// ── Calibration constants (chosen, not trained) ──────────────────────────────
export const K_FACTOR = 40; // Elo update step for World Cup matches.
export const HFA_ELO = 70; // home-field bump, applied to actual 2026 hosts only.
export const BASE_TOTAL_GOALS = 2.6; // typical combined goals for an even WC tie.
const SUPREMACY_PER_ELO = 0.0045; // goal-supremacy per Elo point of difference.
const RHO = -0.05; // Dixon–Coles low-score dependency correction.
const MAX_GOALS = 8; // score grid upper bound (0..MAX_GOALS each side).
const MIN_LAMBDA = 0.15; // floor so a heavy favourite never gets λ ≤ 0.

export type WinProb = {
  home: number; // win % (integer, home/draw/away sum to 100)
  draw: number;
  away: number;
  pick: string; // human one-liner, e.g. "Brazil favoured to take it"
  scoreline: string; // most-likely final score, e.g. "2–1"
  basis: string; // honest provenance label
};

const BASIS = "Elo + Poisson · free-data estimate";

// Minimal shape needed to update ratings (works with lib/types Match).
export type RatedMatch = { h: string; a: string; hs: number | null; as: number | null; st: string; utc: string };

// ── Elo ──────────────────────────────────────────────────────────────────────

function rating(ratings: Record<string, number>, code: string, fallback: number): number {
  return ratings[code] ?? fallback;
}

function expectedHome(rh: number, ra: number, hfa: number): number {
  return 1 / (1 + Math.pow(10, -(rh - ra + hfa) / 400));
}

// eloratings.net goal-difference multiplier: bigger wins move ratings more.
function marginMultiplier(margin: number): number {
  const m = Math.abs(margin);
  if (m <= 1) return 1;
  if (m === 2) return 1.5;
  return (11 + m) / 8;
}

// Replay every finished match (chronological) on top of the seed so ratings track
// real tournament form. Returns a fresh ratings map; the seed is not mutated.
export function computeRatings(
  matches: RatedMatch[],
  seed: Record<string, number>,
  hostCodes: ReadonlySet<string>,
  defaultElo: number,
): Record<string, number> {
  const r: Record<string, number> = { ...seed };
  const finished = matches
    .filter((m) => m.st === "ft" && m.hs != null && m.as != null)
    .sort((a, b) => a.utc.localeCompare(b.utc));

  for (const m of finished) {
    const rh = rating(r, m.h, defaultElo);
    const ra = rating(r, m.a, defaultElo);
    const hfa = hostCodes.has(m.h) ? HFA_ELO : 0;
    const e = expectedHome(rh, ra, hfa);
    const hs = m.hs as number;
    const as = m.as as number;
    const actual = hs > as ? 1 : hs === as ? 0.5 : 0;
    const delta = K_FACTOR * marginMultiplier(hs - as) * (actual - e);
    r[m.h] = rh + delta;
    r[m.a] = ra - delta;
  }
  return r;
}

// ── Goals model ────────────────────────────────────────────────────────────

// Map a (host-adjusted) Elo gap to each side's expected goals.
function lambdas(rh: number, ra: number, hfa: number): [number, number] {
  const supremacy = SUPREMACY_PER_ELO * (rh - ra + hfa);
  const lh = Math.max(MIN_LAMBDA, (BASE_TOTAL_GOALS + supremacy) / 2);
  const la = Math.max(MIN_LAMBDA, (BASE_TOTAL_GOALS - supremacy) / 2);
  return [lh, la];
}

function poisson(k: number, lambda: number): number {
  let fact = 1;
  for (let i = 2; i <= k; i++) fact *= i;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / fact;
}

// Dixon–Coles correction for the four low-scoring cells.
function dcTau(i: number, j: number, lh: number, la: number): number {
  if (i === 0 && j === 0) return 1 - lh * la * RHO;
  if (i === 0 && j === 1) return 1 + lh * RHO;
  if (i === 1 && j === 0) return 1 + la * RHO;
  if (i === 1 && j === 1) return 1 - RHO;
  return 1;
}

// Normalized score matrix P[i][j] over the 0..MAX_GOALS grid.
function scoreMatrix(lh: number, la: number): number[][] {
  const ph = Array.from({ length: MAX_GOALS + 1 }, (_, i) => poisson(i, lh));
  const pa = Array.from({ length: MAX_GOALS + 1 }, (_, j) => poisson(j, la));
  const m: number[][] = [];
  let sum = 0;
  for (let i = 0; i <= MAX_GOALS; i++) {
    m[i] = [];
    for (let j = 0; j <= MAX_GOALS; j++) {
      const p = dcTau(i, j, lh, la) * ph[i] * pa[j];
      m[i][j] = p;
      sum += p;
    }
  }
  for (let i = 0; i <= MAX_GOALS; i++) for (let j = 0; j <= MAX_GOALS; j++) m[i][j] /= sum;
  return m;
}

// Round three floats (summing ~1) to integer percentages summing exactly 100.
function toPct(home: number, draw: number, away: number): { home: number; draw: number; away: number } {
  const raw = [home * 100, draw * 100, away * 100];
  const floor = raw.map(Math.floor);
  let rem = 100 - floor.reduce((a, b) => a + b, 0);
  // Hand the leftover points to the largest fractional parts.
  const order = raw.map((v, i) => ({ i, frac: v - floor[i] })).sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < order.length && rem > 0; k++, rem--) floor[order[k].i]++;
  return { home: floor[0], draw: floor[1], away: floor[2] };
}

function pickLine(home: number, away: number, homeName: string, awayName: string): string {
  if (Math.abs(home - away) <= 4) return "Too close to call";
  return `${home > away ? homeName : awayName} favoured to take it`;
}

// Aggregate a score matrix (over FINAL scores) into a WinProb. `baseH/baseA` shift
// the grid by goals already scored (0/0 pre-match), so the argmax cell and the
// W/D/L sums are computed on final scorelines.
function summarize(m: number[][], baseH: number, baseA: number, homeName: string, awayName: string): WinProb {
  let h = 0, d = 0, a = 0, best = -1, bi = 0, bj = 0;
  for (let i = 0; i <= MAX_GOALS; i++) {
    for (let j = 0; j <= MAX_GOALS; j++) {
      const p = m[i][j];
      const fh = baseH + i;
      const fa = baseA + j;
      if (fh > fa) h += p;
      else if (fh === fa) d += p;
      else a += p;
      if (p > best) { best = p; bi = fh; bj = fa; }
    }
  }
  const pct = toPct(h, d, a);
  return { ...pct, pick: pickLine(pct.home, pct.away, homeName, awayName), scoreline: `${bi}–${bj}`, basis: BASIS };
}

// ── Public entry points ──────────────────────────────────────────────────────

// Pre-match probabilities from current ratings.
export function matchProbabilities(
  rh: number,
  ra: number,
  isHostHome: boolean,
  homeName: string,
  awayName: string,
): WinProb {
  const [lh, la] = lambdas(rh, ra, isHostHome ? HFA_ELO : 0);
  return summarize(scoreMatrix(lh, la), 0, 0, homeName, awayName);
}

// Fraction of regulation time still to play, from the live minute string.
export function remainingFraction(minute: string | null | undefined): number {
  if (!minute) return 0.02;
  const s = minute.toLowerCase();
  if (s.includes("ft") || s.includes("full")) return 0.02;
  let elapsed: number;
  if (s.includes("ht") || s.includes("half")) {
    elapsed = 45;
  } else {
    const m = s.match(/(\d+)(?:\s*\+\s*(\d+))?/);
    if (!m) return 0.5; // "LIVE" with no clock → assume mid-match uncertainty
    elapsed = parseInt(m[1], 10) + (m[2] ? parseInt(m[2], 10) : 0);
  }
  if (elapsed >= 90) return 0.02;
  return Math.max(0.02, (90 - elapsed) / 90);
}

// In-play probabilities: scale expected goals to the time remaining, distribute the
// ADDITIONAL goals, then shift by the goals already scored.
export function inPlayProbabilities(
  rh: number,
  ra: number,
  isHostHome: boolean,
  goalsHome: number,
  goalsAway: number,
  minute: string | null | undefined,
  homeName: string,
  awayName: string,
): WinProb {
  const [lh, la] = lambdas(rh, ra, isHostHome ? HFA_ELO : 0);
  const frac = remainingFraction(minute);
  const m = scoreMatrix(lh * frac, la * frac); // distribution of remaining goals
  return summarize(m, goalsHome, goalsAway, homeName, awayName);
}
