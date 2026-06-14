"use client";
import { RefreshCw } from "lucide-react";
import { useMounted } from "@/hooks/useMounted";

export function SyncPill({
  source,
  syncedAt,
  isFetching,
  onRefresh,
}: {
  source: "live" | "snapshot";
  syncedAt: string;
  isFetching: boolean;
  onRefresh: () => void;
}) {
  const mounted = useMounted();
  const dot = isFetching ? "bg-amber-400 anim-blink" : source === "live" ? "bg-green anim-pulse" : "bg-dim";
  // The synced time is in the viewer's local zone, so only show it after mount.
  const t = mounted ? new Date(syncedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "";
  const label = isFetching
    ? "Syncing…"
    : source === "live"
      ? `Live${t ? " · synced " + t : ""}`
      : "Offline · snapshot";
  return (
    <div className="flex items-center gap-2.5 border border-line2 rounded-full bg-panel2 px-3 py-1.5 ff-mono text-[11px] whitespace-nowrap">
      <span className={`w-2 h-2 rounded-full flex-none ${dot}`} style={{ background: source === "live" && !isFetching ? "var(--green)" : undefined }} />
      <span className="text-muted">{label}</span>
      <button
        onClick={onRefresh}
        className="ff-cond uppercase tracking-wider font-semibold text-[11px] text-text border-l border-line2 pl-2.5 ml-0.5 hover:text-green flex items-center gap-1"
        aria-label="Refresh data"
      >
        <RefreshCw size={11} className={isFetching ? "anim-blink" : ""} /> Refresh
      </button>
    </div>
  );
}
