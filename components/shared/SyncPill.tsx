"use client";
import { RefreshCw } from "lucide-react";
import { useMounted } from "@/hooks/useMounted";
import type { DataSource } from "@/lib/sports/types";

export function SyncPill({
  source,
  syncedAt,
  isFetching,
  onRefresh,
}: {
  source: DataSource;
  syncedAt: string;
  isFetching: boolean;
  onRefresh: () => void;
}) {
  const mounted = useMounted();
  const live = source === "live" && !isFetching;
  // The synced time is in the viewer's local zone, so only show it after mount.
  const t = mounted ? new Date(syncedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "";
  const label = isFetching
    ? "Syncing…"
    : source === "live"
      ? `Live${t ? " · synced " + t : ""}`
      : "Offline · snapshot";
  return (
    <div className="flex items-center gap-2.5 border border-line2 rounded-full bg-panel2 px-3 py-1.5 ff-mono text-[11px] whitespace-nowrap">
      <span
        className={`w-2 h-2 rounded-full flex-none ${isFetching ? "anim-blink" : live ? "anim-accent-pulse" : ""}`}
        style={{ background: isFetching ? "var(--amber)" : live ? "var(--accent)" : "var(--dim)" }}
      />
      <span className="text-muted">{label}</span>
      <button
        onClick={onRefresh}
        className="ff-cond uppercase tracking-wider font-semibold text-[11px] text-text border-l border-line2 pl-2.5 ml-0.5 flex items-center gap-1 hover:opacity-80"
        style={{ color: undefined }}
        aria-label="Refresh data"
      >
        <RefreshCw size={11} className={isFetching ? "anim-blink" : ""} /> Refresh
      </button>
    </div>
  );
}
