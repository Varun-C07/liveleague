"use client";
import { Globe } from "lucide-react";
import { SyncPill } from "./SyncPill";
import { usePrefs } from "@/hooks/usePrefs";
import { tzLabel, type TzMode } from "@/lib/time";
import type { BundleReason, DataSource } from "@liveleague/core/sports/types";

function nextTz(tz: TzMode): TzMode {
  return tz === "ET" ? "local" : tz === "local" ? "UTC" : "ET";
}

// Accent-themed board header shared by every sport page.
export function SportHeader({
  eyebrow,
  title,
  sub,
  source,
  reason,
  syncedAt,
  isFetching,
  onRefresh,
  children,
}: {
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  sub?: React.ReactNode;
  source: DataSource;
  reason?: BundleReason;
  syncedAt: string;
  isFetching: boolean;
  onRefresh: () => void;
  children?: React.ReactNode;
}) {
  const { tz, setTz } = usePrefs();
  return (
    <header className="relative overflow-hidden rounded-2xl border border-line glass p-5">
      <span className="absolute left-0 top-0 bottom-0 w-1.5" style={{ background: "var(--accent)" }} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="ff-cond tracking-[0.28em] text-[12px] font-bold uppercase" style={{ color: "var(--accent)" }}>
            {eyebrow}
          </div>
          <h1
            className="ff-cond font-bold uppercase leading-[0.92] tracking-tight mt-1"
            style={{ fontSize: "clamp(28px,6.4vw,52px)" }}
          >
            {title}
          </h1>
          {sub && <p className="text-muted text-[13.5px] mt-2 max-w-[58ch]">{sub}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTz(nextTz(tz))}
            title="Change timezone"
            className="flex items-center gap-1 border border-line2 rounded-full bg-panel2 px-2.5 py-1.5 ff-mono text-[11px] text-muted hover:text-text"
          >
            <Globe size={12} /> {tzLabel(tz)}
          </button>
          <SyncPill source={source} reason={reason} syncedAt={syncedAt} isFetching={isFetching} onRefresh={onRefresh} />
        </div>
      </div>
      {children}
    </header>
  );
}
