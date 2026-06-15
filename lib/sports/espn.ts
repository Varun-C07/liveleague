import type { Competitor, Game, GameExtra, GameStatus, SportId } from "./types";

// Minimal subset of ESPN's public scoreboard JSON that we read.
type EspnTeam = {
  abbreviation?: string;
  displayName?: string;
  shortDisplayName?: string;
  color?: string;
  logo?: string;
};
type EspnComp = { homeAway?: string; team?: EspnTeam; score?: string; winner?: boolean };
type EspnStatusType = { state?: string; completed?: boolean; shortDetail?: string; detail?: string; description?: string };
type EspnStatus = { type?: EspnStatusType; period?: number; displayClock?: string };
type EspnCompetition = {
  competitors?: EspnComp[];
  venue?: { fullName?: string; address?: { city?: string; state?: string; country?: string } };
  status?: EspnStatus;
  situation?: { outs?: number };
};
export type EspnEvent = {
  id?: string;
  date?: string;
  shortName?: string;
  name?: string;
  competitions?: EspnCompetition[];
  status?: EspnStatus;
};

export type EspnMapped = { event: EspnEvent; competition: EspnCompetition; status?: EspnStatus };

function hexColor(c?: string): string {
  if (!c) return "#8a909e";
  return c.startsWith("#") ? c : `#${c}`;
}

export function stateToStatus(state?: string): GameStatus {
  return state === "in" ? "live" : state === "post" ? "final" : "sched";
}

export async function fetchEspnScoreboard(path: string, revalidate: number): Promise<EspnEvent[]> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/${path}/scoreboard`;
  const res = await fetch(url, { headers: { Accept: "application/json" }, next: { revalidate, tags: [path] } });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const j = (await res.json()) as { events?: EspnEvent[] };
  return j.events || [];
}

// Map one ESPN event into a generic Game. `makeExtra` supplies the sport-specific
// live detail (quarter/clock, inning/outs, …).
export function mapEspnEvent(
  ev: EspnEvent,
  sport: SportId,
  makeExtra: (m: EspnMapped) => GameExtra,
): Game | null {
  const competition = ev.competitions?.[0];
  if (!competition) return null;
  const cs = competition.competitors || [];
  const homeC = cs.find((c) => c.homeAway === "home") || cs[0];
  const awayC = cs.find((c) => c.homeAway === "away") || cs[1];
  if (!homeC || !awayC) return null;

  const status = competition.status || ev.status;
  const st = stateToStatus(status?.type?.state);
  const toComp = (c: EspnComp): Competitor => ({
    code: c.team?.abbreviation || "?",
    name: c.team?.shortDisplayName || c.team?.displayName || c.team?.abbreviation || "?",
    logoUrl: c.team?.logo,
    color: hexColor(c.team?.color),
    score: st === "sched" ? null : c.score != null && c.score !== "" ? parseInt(c.score, 10) : null,
    real: true,
  });

  const addr = competition.venue?.address;
  return {
    id: `${sport}-${ev.id}`,
    sport,
    status: st,
    utc: ev.date || new Date().toISOString(),
    approx: false,
    venue: competition.venue?.fullName,
    city: addr?.city,
    country: addr?.state || addr?.country,
    home: toComp(homeC),
    away: toComp(awayC),
    label: status?.type?.shortDetail || ev.shortName || "",
    extra: makeExtra({ event: ev, competition, status }),
  };
}
