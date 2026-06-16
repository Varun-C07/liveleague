import type { AgendaResponse, Game } from "./types";
import { SPORTS } from "./registry";
import { inAgendaWindow } from "./agenda-window";

function windowed(games: Game[]): Game[] {
  const now = Date.now();
  return games
    .filter((g) => inAgendaWindow(g, now))
    .sort((a, b) => +new Date(a.utc) - +new Date(b.utc));
}

// Live cross-sport agenda: fan out, each sport degrades to its snapshot on error.
export async function agendaData(): Promise<AgendaResponse> {
  const bundles = await Promise.all(
    SPORTS.map((s) => s.getLive(false).catch(() => s.snapshot())),
  );
  return { syncedAt: new Date().toISOString(), games: windowed(bundles.flatMap((b) => b.games)) };
}

// Synchronous snapshot agenda to seed SSR.
export function snapshotAgenda(): AgendaResponse {
  return { syncedAt: new Date().toISOString(), games: windowed(SPORTS.flatMap((s) => s.snapshot().games)) };
}
