// Full World Cup group-stage qualification solver. Pure + deterministic so it
// can be unit-tested (tests/group-scenarios.test.ts) and run client-side inside
// the GroupCard. Top 2 of each group advance directly; the 8 best third-placed
// teams also advance (cross-group, so third place is flagged as "in contention"
// rather than decided here).
//
// Method: enumerate every win/draw/loss combination of the group's remaining
// fixtures (≤ 6 left → ≤ 3^6 = 729 combos, trivial). Each combo yields a final
// points table; teams are ranked Pts → GD → GF → code, using the CURRENT GD/GF
// as the tiebreak proxy (goals in the remaining matches are unknowable). This is
// exact for completed groups and for any points-clear case; only true GD
// knife-edges in live groups are approximate — worded as "alive", never claimed.

export type TeamStanding = {
  code: string;
  Pts: number;
  GD: number;
  GF: number;
};

export type RemainingMatch = { home: string; away: string };

export type OutlookState = "through" | "contention" | "alive" | "out";

export type TeamOutlook = {
  code: string;
  state: OutlookState;
  line: string; // plain-English status, e.g. "Win to qualify"
  clinched: boolean; // guaranteed top 2 regardless of remaining results
};

const RESULTS = [0, 1, 2] as const; // 0 = home win, 1 = draw, 2 = away win

// Final points vector for one enumerated combination of remaining results.
function pointsFor(
  base: Record<string, number>,
  remaining: RemainingMatch[],
  combo: number[],
): Record<string, number> {
  const pts = { ...base };
  remaining.forEach((m, i) => {
    const r = combo[i];
    if (r === 0) pts[m.home] += 3;
    else if (r === 2) pts[m.away] += 3;
    else {
      pts[m.home] += 1;
      pts[m.away] += 1;
    }
  });
  return pts;
}

// Deterministic finishing rank (1 = top) for `code` under a final points vector,
// breaking points-ties by current GD, then GF, then code — the FIFA order minus
// head-to-head (which we can't model without scorelines). Returns 1..N.
function rankOf(
  code: string,
  pts: Record<string, number>,
  tb: Record<string, { GD: number; GF: number }>,
): number {
  const better = (a: string, b: string): boolean => {
    if (pts[a] !== pts[b]) return pts[a] > pts[b];
    if (tb[a].GD !== tb[b].GD) return tb[a].GD > tb[b].GD;
    if (tb[a].GF !== tb[b].GF) return tb[a].GF > tb[b].GF;
    return a < b;
  };
  let rank = 1;
  for (const c of Object.keys(pts)) {
    if (c !== code && better(c, code)) rank++;
  }
  return rank;
}

// Enumerate combos; for each, yield index + the result tuple.
function eachCombo(n: number, cb: (combo: number[]) => void) {
  const combo = new Array(n).fill(0);
  const total = Math.pow(3, n);
  for (let i = 0; i < total; i++) {
    let x = i;
    for (let j = 0; j < n; j++) {
      combo[j] = RESULTS[x % 3];
      x = Math.floor(x / 3);
    }
    cb(combo);
  }
}

// Which remaining-fixture indices involve `code`, and the result code that
// represents a WIN / DRAW for that team in each (so we can condition on a
// team's own results when wording the "what they need" line).
function ownMatches(code: string, remaining: RemainingMatch[]) {
  const idx: { i: number; win: number; draw: number }[] = [];
  remaining.forEach((m, i) => {
    if (m.home === code) idx.push({ i, win: 0, draw: 1 });
    else if (m.away === code) idx.push({ i, win: 2, draw: 1 });
  });
  return idx;
}

export function groupOutlook(
  standings: TeamStanding[],
  remaining: RemainingMatch[],
): Record<string, TeamOutlook> {
  const codes = standings.map((s) => s.code);
  const base: Record<string, number> = {};
  const tb: Record<string, { GD: number; GF: number }> = {};
  for (const s of standings) {
    base[s.code] = s.Pts;
    tb[s.code] = { GD: s.GD, GF: s.GF };
  }

  // Only fixtures between two teams in this group matter.
  const rem = remaining.filter(
    (m) => base[m.home] !== undefined && base[m.away] !== undefined,
  );

  // Per team: can it ever be top-2 / top-3, and is it always (clinched) top-2?
  const everTop2: Record<string, boolean> = {};
  const everTop3: Record<string, boolean> = {};
  const alwaysTop2: Record<string, boolean> = {};
  for (const c of codes) {
    everTop2[c] = false;
    everTop3[c] = false;
    alwaysTop2[c] = true;
  }

  eachCombo(rem.length, (combo) => {
    const pts = pointsFor(base, rem, combo);
    for (const c of codes) {
      const rank = rankOf(c, pts, tb);
      if (rank <= 2) everTop2[c] = true;
      if (rank <= 3) everTop3[c] = true;
      if (rank > 2) alwaysTop2[c] = false;
    }
  });

  const out: Record<string, TeamOutlook> = {};
  for (const c of codes) {
    const own = ownMatches(c, rem);
    if (alwaysTop2[c]) {
      out[c] = { code: c, state: "through", line: "Through to the last 32", clinched: true };
    } else if (!everTop2[c] && !everTop3[c]) {
      out[c] = { code: c, state: "out", line: "Eliminated", clinched: false };
    } else if (!everTop2[c]) {
      // Can't reach top 2, but could still sneak a best-third place.
      out[c] = {
        code: c,
        state: "contention",
        line:
          own.length === 0
            ? "3rd place — awaits best-third cutoff"
            : "Chasing a best-third place",
        clinched: false,
      };
    } else {
      out[c] = { code: c, state: "alive", line: needLine(c, base, tb, rem, own), clinched: false };
    }
  }
  return out;
}

// Word the "what they need" line for an alive team by conditioning on its own
// remaining result(s). Precise for the common final-round case (one match left).
function needLine(
  code: string,
  base: Record<string, number>,
  tb: Record<string, { GD: number; GF: number }>,
  rem: RemainingMatch[],
  own: { i: number; win: number; draw: number }[],
): string {
  if (own.length === 0) return "Qualification depends on other results";

  // Does forcing this team's own matches to a given target (win/draw) guarantee
  // top 2 across ALL combinations of the other fixtures? "secures" = guaranteed.
  const others = rem
    .map((_, i) => i)
    .filter((i) => !own.some((o) => o.i === i));

  function securesWith(target: "win" | "draw"): { secures: boolean; possible: boolean } {
    let secures = true;
    let possible = false;
    const fixed = own.map((o) => (target === "win" ? o.win : o.draw));
    const combo = new Array(rem.length).fill(0);
    own.forEach((o, k) => (combo[o.i] = fixed[k]));
    eachCombo(others.length, (oc) => {
      others.forEach((idx, k) => (combo[idx] = oc[k]));
      const pts = pointsFor(base, rem, combo);
      const rank = rankOf(code, pts, tb);
      if (rank > 2) secures = false;
      if (rank <= 2) possible = true;
    });
    return { secures, possible };
  }

  const win = securesWith("win");
  const draw = securesWith("draw");

  if (own.length === 1) {
    if (draw.secures) return "A draw secures qualification";
    if (win.secures && draw.possible) return "Win, or draw and hope elsewhere";
    if (win.secures) return "Win to qualify";
    if (win.possible) return "Must win and depend on other results";
    return "Qualification depends on other results";
  }

  // More than one match left (earlier rounds): coarser but honest wording.
  if (win.secures) return "Win out to guarantee a spot";
  if (win.possible) return "Still in contention";
  return "Qualification depends on other results";
}
