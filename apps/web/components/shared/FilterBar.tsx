"use client";

export type FilterDef<K extends string> = { key: K; label: string; live?: boolean };

// Generic filter chips with counts. The active chip fills in; a `live` chip
// fills with the sport accent.
export function FilterBar<K extends string>({
  defs,
  value,
  counts,
  onChange,
}: {
  defs: FilterDef<K>[];
  value: K;
  counts: Record<K, number>;
  onChange: (k: K) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 my-4">
      {defs.map((d) => {
        const on = value === d.key;
        const base =
          "ff-cond uppercase tracking-wide font-semibold text-[13px] px-3.5 py-1.5 rounded-md cursor-pointer transition border";
        const style: React.CSSProperties = on
          ? d.live
            ? { background: "var(--accent)", borderColor: "var(--accent)", color: "#06100b" }
            : { background: "var(--text)", borderColor: "var(--text)", color: "var(--bg)" }
          : { background: "var(--panel)", borderColor: "var(--line)", color: "var(--muted)" };
        return (
          <button key={d.key} className={base} style={style} onClick={() => onChange(d.key)}>
            {d.label}
            <span className="ff-mono text-[11px] opacity-70 ml-1.5">{counts[d.key]}</span>
          </button>
        );
      })}
    </div>
  );
}
