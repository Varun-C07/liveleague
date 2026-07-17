import type { TeamRef } from "@liveleagues/core/api-shape";

export function TeamBadge({
  team,
  score,
  win,
  lose,
  size = "md",
}: {
  team: TeamRef;
  score?: number | null;
  win?: boolean;
  lose?: boolean;
  size?: "sm" | "md";
}) {
  const big = size === "md";
  return (
    <div className={`flex items-center gap-2 min-w-0 ${lose ? "opacity-60" : ""}`}>
      <span className="w-[3px] flex-none rounded-sm" style={{ height: big ? 16 : 13, background: team.color }} />
      {team.real ? (
        <span className="flex-none text-center" style={{ width: 22, fontSize: big ? 15 : 13 }}>{team.flag}</span>
      ) : (
        <span className="flex-none text-center text-dim" style={{ width: 22 }}>·</span>
      )}
      {team.real ? (
        <span
          className={`ff-cond font-semibold uppercase tracking-wide truncate ${win ? "text-white" : ""}`}
          style={{ fontSize: big ? 16 : 13.5 }}
        >
          {team.name}
          <span className="ff-mono text-dim font-normal normal-case ml-1.5" style={{ fontSize: 10 }}>
            {team.code}
          </span>
        </span>
      ) : (
        <span className="ff-mono text-muted truncate" style={{ fontSize: 12.5 }}>{team.code}</span>
      )}
      {score != null && (
        <span
          className={`ml-auto ff-mono font-bold flex-none pl-2 ${win ? "text-green" : "text-muted"}`}
          style={{ fontSize: big ? 17 : 14 }}
        >
          {score}
        </span>
      )}
    </div>
  );
}
