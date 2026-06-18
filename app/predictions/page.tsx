"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useMyPredictions, useSubmitPrediction } from "@/hooks/usePredictions";
import type { LiveBundle, Game } from "@/lib/sports/types";

export default function PredictionsPage() {
  const { user, configured, loading, signInWithGoogle } = useAuth();
  const { hasPersonal } = useEntitlements();

  const soccer = useQuery({
    queryKey: ["sport", "soccer"],
    queryFn: async (): Promise<LiveBundle> => {
      const res = await fetch("/api/soccer");
      if (!res.ok) throw new Error("soccer_failed");
      return res.json();
    },
    staleTime: 30_000,
  });

  const { data: predictions } = useMyPredictions();
  const predByMatch = useMemo(
    () => new Map((predictions ?? []).map((p) => [p.match_id, p])),
    [predictions],
  );

  const upcoming = (soccer.data?.games ?? [])
    .filter((g) => g.status === "sched")
    .slice(0, 12);

  return (
    <div className="max-w-[760px] mx-auto px-4 py-8">
      <h1 className="ff-cond font-bold uppercase tracking-[0.12em] text-2xl">
        Match predictor
      </h1>
      <p className="mt-1 text-sm text-muted">
        3 pts for an exact score, 1 pt for the right result. Locked at kickoff.
      </p>

      {!configured ? (
        <p className="mt-6 text-muted">Backend not configured.</p>
      ) : loading ? (
        <p className="mt-6 text-dim">…</p>
      ) : !user ? (
        <button
          onClick={signInWithGoogle}
          className="mt-6 rounded-full border px-4 py-2 ff-cond uppercase tracking-wide font-semibold text-sm"
          style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
        >
          Sign in to predict
        </button>
      ) : !hasPersonal ? (
        <div className="mt-6 rounded-xl border border-line2 p-4">
          <p className="text-muted">
            Predicting is part of the <b className="text-text">Personal</b> plan.
          </p>
          <a
            href="/account"
            className="mt-3 inline-block rounded-full border px-4 py-2 ff-cond uppercase tracking-wide font-semibold text-[12px]"
            style={{
              borderColor: "var(--accent)",
              color: "var(--accent)",
              background: "color-mix(in srgb, var(--accent) 14%, transparent)",
            }}
          >
            Unlock predictions
          </a>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-2">
          {upcoming.length === 0 ? (
            <p className="text-muted">No upcoming matches to predict right now.</p>
          ) : (
            upcoming.map((g) => (
              <PredRow
                key={g.id}
                game={g}
                existing={predByMatch.get(g.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function PredRow({
  game,
  existing,
}: {
  game: Game;
  existing?: { pred_home: number; pred_away: number; points: number | null };
}) {
  const submit = useSubmitPrediction();
  const [h, setH] = useState<string>(existing ? String(existing.pred_home) : "");
  const [a, setA] = useState<string>(existing ? String(existing.pred_away) : "");

  function save() {
    const predHome = Number(h);
    const predAway = Number(a);
    if (!Number.isInteger(predHome) || !Number.isInteger(predAway)) return;
    submit.mutate({ matchId: game.id, predHome, predAway });
  }

  return (
    <div className="rounded-lg border border-line2 px-3 py-2 flex items-center gap-2 text-sm">
      <span className="flex-1 truncate">
        {game.home.name} <span className="text-dim">v</span> {game.away.name}
      </span>
      <input
        inputMode="numeric"
        value={h}
        onChange={(e) => setH(e.target.value.replace(/\D/g, "").slice(0, 2))}
        className="w-9 text-center rounded border border-line2 bg-transparent py-1"
        aria-label={`${game.home.name} score`}
      />
      <span className="text-dim">-</span>
      <input
        inputMode="numeric"
        value={a}
        onChange={(e) => setA(e.target.value.replace(/\D/g, "").slice(0, 2))}
        className="w-9 text-center rounded border border-line2 bg-transparent py-1"
        aria-label={`${game.away.name} score`}
      />
      <button
        onClick={save}
        disabled={submit.isPending || h === "" || a === ""}
        className="rounded-full border px-3 py-1 ff-cond uppercase tracking-wide font-semibold text-[11px] disabled:opacity-50"
        style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
      >
        {submit.isPending ? "…" : existing ? "Update" : "Save"}
      </button>
    </div>
  );
}
