"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

export type Prediction = {
  match_id: string;
  pred_home: number;
  pred_away: number;
  kickoff_utc: string;
  locked: boolean;
  actual_home: number | null;
  actual_away: number | null;
  points: number | null;
  outcome: string | null;
};

export function useMyPredictions() {
  const { user, configured } = useAuth();
  return useQuery({
    queryKey: ["predictions", user?.id ?? null],
    queryFn: async (): Promise<Prediction[]> => {
      const res = await fetch("/api/predictions");
      if (!res.ok) throw new Error("predictions_failed");
      const data = (await res.json()) as { predictions: Prediction[] };
      return data.predictions ?? [];
    },
    enabled: configured && !!user,
    staleTime: 30_000,
  });
}

export function useSubmitPrediction() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (v: {
      matchId: string;
      predHome: number;
      predAway: number;
    }) => {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(v),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "submit_failed");
      return data;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["predictions", user?.id ?? null] }),
  });
}
