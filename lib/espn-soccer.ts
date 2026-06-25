import { codeFromName, type RawEvent } from "@/lib/normalize";

// ESPN's free public scoreboard is near-real-time for the World Cup (the free
// TheSportsDB feed lags live scores badly). We use it purely as the LIVE source:
// normalize its events into the same RawEvent shape `applyEvents` already
// consumes, so all the team-matching + clamp logic is reused unchanged.

const ESPN = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";

type EspnCompetitor = {
  homeAway?: string;
  score?: string;
  team?: { abbreviation?: string; displayName?: string; name?: string };
};
type EspnStatus = {
  displayClock?: string;
  type?: { state?: string; shortDetail?: string; completed?: boolean };
};
type EspnEvent = {
  id?: string | number;
  date?: string;
  competitions?: { competitors?: EspnCompetitor[] }[];
  status?: EspnStatus;
};

// Pick a team string our resolver (codeFromName) can map: prefer whichever of
// the abbreviation / full name it recognizes.
function teamKey(c: EspnCompetitor | undefined): string {
  const abbr = c?.team?.abbreviation;
  const name = c?.team?.displayName || c?.team?.name;
  if (abbr && codeFromName(abbr)) return abbr;
  if (name && codeFromName(name)) return name;
  return abbr || name || "";
}

// Map ESPN's status to the string parseStatus() understands.
function statusLabel(s: EspnStatus | undefined): { status: string | null; progress: string | null } {
  const state = s?.type?.state; // "pre" | "in" | "post"
  if (state === "post") return { status: "FT", progress: null };
  if (state === "pre") return { status: "NS", progress: null };
  // in-play: hand parseStatus a clean minute ("66") or "HALF".
  const raw = s?.displayClock || s?.type?.shortDetail || "";
  if (/half|ht/i.test(raw)) return { status: null, progress: "HALF" };
  const m = raw.match(/\d+/);
  return { status: null, progress: m ? m[0] : "LIVE" };
}

function parse(j: Record<string, unknown> | null): RawEvent[] {
  const events = (j?.events as EspnEvent[]) || [];
  const out: RawEvent[] = [];
  for (const e of events) {
    const comp = e.competitions?.[0]?.competitors || [];
    const home = comp.find((c) => c.homeAway === "home");
    const away = comp.find((c) => c.homeAway === "away");
    if (!home || !away) continue;
    const { status, progress } = statusLabel(e.status);
    out.push({
      strHomeTeam: teamKey(home),
      strAwayTeam: teamKey(away),
      intHomeScore: home.score ?? null,
      intAwayScore: away.score ?? null,
      strStatus: status ?? undefined,
      strProgress: progress ?? undefined,
      strTimestamp: e.date,
      espnId: e.id != null ? String(e.id) : undefined,
    });
  }
  return out;
}

async function fetchJSON(url: string, revalidate: number): Promise<Record<string, unknown> | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 7000);
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate, tags: ["wc-live"] },
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return (await res.json()) as Record<string, unknown>;
  } finally {
    clearTimeout(timer);
  }
}

// Live scoreboard for the given ET-ish UTC dates (YYYY-MM-DD). Returns [] on any
// failure so the caller degrades to cached/snapshot data.
export async function fetchEspnSoccer(dates: string[], revalidate = 20): Promise<RawEvent[]> {
  const lists = await Promise.all(
    dates.map((d) =>
      fetchJSON(`${ESPN}?dates=${d.replace(/-/g, "")}`, revalidate)
        .then(parse)
        .catch(() => [] as RawEvent[]),
    ),
  );
  return lists.flat();
}
