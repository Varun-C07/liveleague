"use client";
import { RefreshCw } from "lucide-react";
import { useMounted } from "@/hooks/useMounted";
import type { BundleReason, DataSource } from "@liveleagues/core/sports/types";

export function SyncPill({
  source,
  reason,
  syncedAt,
  isFetching,
  onRefresh,
}: {
  source: DataSource;
  reason?: BundleReason;
  syncedAt: string;
  isFetching: boolean;
  onRefresh: () => void;
}) {
  const mounted = useMounted();
  // The synced time is in the viewer's local zone, so only show it after mount.
  const t = mounted ? new Date(syncedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "";

  // Back-compat: derive a reason from source when one isn't supplied.
  const r: BundleReason = reason ?? (source === "live" ? "live" : "fallback");

  let label: string;
  let dotColor: string;
  let dotAnim = "";
  if (isFetching) {
    label = "Syncing…";
    dotColor = "var(--amber)";
    dotAnim = "anim-blink";
  } else if (r === "live") {
    label = `Live${t ? " · synced " + t : ""}`;
    dotColor = "var(--accent)";
    dotAnim = "anim-accent-pulse";
  } else if (r === "empty") {
    label = "No games today";
    dotColor = "var(--dim)";
  } else if (r === "sample") {
    label = "Sample data";
    dotColor = "var(--dim)";
  } else {
    label = "Showing saved data";
    dotColor = "var(--amber)";
  }

  return (
    <div className="flex items-center gap-2.5 border border-line2 rounded-full bg-panel2 px-3 py-1.5 ff-mono text-[11px] whitespace-nowrap">
      <span className={`w-2 h-2 rounded-full flex-none ${dotAnim}`} style={{ background: dotColor }} />
      <span className="text-muted">{label}</span>
      <button
        onClick={onRefresh}
        className="ff-cond uppercase tracking-wider font-semibold text-[11px] text-text border-l border-line2 pl-2.5 ml-0.5 flex items-center gap-1 hover:opacity-80"
        aria-label="Refresh data"
      >
        <RefreshCw size={11} className={isFetching ? "anim-blink" : ""} /> Refresh
      </button>
    </div>
  );
}
