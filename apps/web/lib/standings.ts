import type { GroupLetter, Match, StandingRow } from "@liveleague/core/types";
import { GROUP_ORDER, GROUP_LETTERS } from "@/data/groups";
import { isRealTeam } from "@/data/teams";

// Compute group tables from completed (FT) results. Pure function.
export function computeGroups(matches: Match[]): Record<string, StandingRow[]> {
  const G: Record<string, Record<string, StandingRow>> = {};
  for (const g of GROUP_LETTERS) {
    G[g] = {};
    for (const c of GROUP_ORDER[g]) {
      G[g][c] = { c, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, Pts: 0 };
    }
  }

  for (const m of matches) {
    if (m.grp == null || m.st !== "ft") continue;
    if (m.hs == null || m.as == null) continue;
    const table = G[m.grp];
    if (!table) continue;
    const H = table[m.h];
    const A = table[m.a];
    if (!H || !A) continue;
    H.P++; A.P++;
    H.GF += m.hs; H.GA += m.as;
    A.GF += m.as; A.GA += m.hs;
    if (m.hs > m.as) { H.W++; A.L++; H.Pts += 3; }
    else if (m.hs < m.as) { A.W++; H.L++; A.Pts += 3; }
    else { H.D++; A.D++; H.Pts++; A.Pts++; }
  }

  const out: Record<string, StandingRow[]> = {};
  for (const g of GROUP_LETTERS) {
    out[g] = Object.values(G[g]).map((r) => ({ ...r, GD: r.GF - r.GA }));
    out[g].sort(
      (a, b) =>
        b.Pts - a.Pts ||
        b.GD - a.GD ||
        b.GF - a.GF ||
        a.c.localeCompare(b.c),
    );
  }
  return out;
}

// Best-8 third-placed teams across the 12 groups (qualify for the R32).
export function bestThirds(groups: Record<string, StandingRow[]>): string[] {
  const thirds = (Object.keys(groups) as GroupLetter[])
    .map((g) => groups[g][2])
    .filter((r): r is StandingRow => !!r && isRealTeam(r.c) && r.P > 0);
  thirds.sort(
    (a, b) => b.Pts - a.Pts || b.GD - a.GD || b.GF - a.GF || a.c.localeCompare(b.c),
  );
  return thirds.slice(0, 8).map((r) => r.c);
}
