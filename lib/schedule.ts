import type { GroupLetter, Match } from "@/lib/types";
import { GROUP_STAGE } from "@/data/groupStage";
import { KNOCKOUTS } from "@/data/knockouts";
import { venueOf } from "@/data/venues";

// Assemble the full 104-match list from the compact source tuples.
function buildMatches(): Match[] {
  const group: Match[] = GROUP_STAGE.map((r) => {
    const v = venueOf(r[4]);
    const hasScore = r.length > 6;
    return {
      n: r[0],
      stage: "Group " + r[1],
      grp: r[1] as GroupLetter,
      h: r[2],
      a: r[3],
      ven: v.stadium,
      city: v.city,
      ctry: v.country,
      utc: r[5],
      hs: hasScore ? (r[6] as number) : null,
      as: hasScore ? (r[7] as number) : null,
      st: hasScore ? "ft" : "sched",
      approx: false,
    };
  });

  const ko: Match[] = KNOCKOUTS.map((r) => {
    const v = venueOf(r[4]);
    return {
      n: r[0],
      stage: r[1],
      grp: null,
      h: r[2],
      a: r[3],
      ven: v.stadium,
      city: v.city,
      ctry: v.country,
      utc: r[5],
      hs: null,
      as: null,
      st: "sched",
      approx: true,
    };
  });

  return [...group, ...ko].sort((a, b) => a.n - b.n);
}

export const SCHEDULE: Match[] = buildMatches();
export const TOTAL_MATCHES = SCHEDULE.length; // 104

// Deep clone so overlays never mutate the source schedule.
export function freshSchedule(): Match[] {
  return SCHEDULE.map((m) => ({ ...m }));
}
