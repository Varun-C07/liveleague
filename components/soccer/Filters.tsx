"use client";

export type FilterKey = "all" | "today" | "live" | "favs" | "done" | "up" | "group" | "ko";

const DEFS: { key: FilterKey; label: string; live?: boolean }[] = [
  { key: "all", label: "All" },
  { key: "today", label: "Today" },
  { key: "live", label: "● Live", live: true },
  { key: "favs", label: "★ My Teams" },
  { key: "done", label: "Completed" },
  { key: "up", label: "Upcoming" },
  { key: "group", label: "Group Stage" },
  { key: "ko", label: "Knockouts" },
];

export function Filters({
  value,
  counts,
  onChange,
}: {
  value: FilterKey;
  counts: Record<FilterKey, number>;
  onChange: (k: FilterKey) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 my-4">
      {DEFS.map((d) => {
        const on = value === d.key;
        const base = "ff-cond uppercase tracking-wide font-semibold text-[13px] px-3.5 py-1.5 rounded-md cursor-pointer transition border";
        const cls = on
          ? d.live
            ? "bg-live border-live text-white"
            : "bg-text border-text text-bg"
          : "text-muted bg-panel border-line hover:text-text hover:border-line2";
        return (
          <button key={d.key} className={`${base} ${cls}`} onClick={() => onChange(d.key)}>
            {d.label}
            <span className="ff-mono text-[11px] opacity-70 ml-1.5">{counts[d.key]}</span>
          </button>
        );
      })}
    </div>
  );
}
