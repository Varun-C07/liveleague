import type { GameStatus } from "./types";

// Pure, client-safe agenda bucketing (no registry/server imports), so both the
// server fan-out and the client board can use it, and it's unit-testable.

export type AgendaBucket = "today" | "week" | "month";
export const AGENDA_BUCKETS: { key: AgendaBucket; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
];

const DAY = 864e5;
const dayIndex = (ms: number) => Math.floor(ms / DAY);

// Which agenda tab a start time falls in (UTC-day based, deterministic so SSR and
// client agree). Recent finals (last 24h) count as "today". null = out of window.
export function bucketFor(utcMs: number, nowMs: number): AgendaBucket | null {
  const d = dayIndex(utcMs) - dayIndex(nowMs);
  if (d < 0) return utcMs >= nowMs - DAY ? "today" : null;
  if (d === 0) return "today";
  if (d <= 7) return "week";
  if (d <= 31) return "month";
  return null;
}

// A game belongs in the agenda if it's live, or within the bucket window.
export function inAgendaWindow(g: { status: GameStatus; utc: string }, now: number): boolean {
  if (g.status === "live") return true;
  return bucketFor(new Date(g.utc).getTime(), now) !== null;
}
