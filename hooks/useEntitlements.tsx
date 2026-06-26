"use client";

import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getBrowserSupabase } from "@/lib/db/supabase-browser";
import { useAuth } from "@/hooks/useAuth";

type MeResponse = {
  user: {
    id: string;
    email: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
  entitlements: { hasPersonal: boolean; hasPro: boolean };
  points: number;
  pinnedMatch: string | null;
};

async function fetchMe(): Promise<MeResponse> {
  const res = await fetch("/api/me");
  if (!res.ok) throw new Error("me_failed");
  return res.json();
}

type EntitlementsValue = {
  hasPersonal: boolean;
  hasPro: boolean;
  points: number;
  pinnedMatch: string | null;
  setPin: (matchId: string | null) => void;
  loading: boolean;
  refresh: () => void;
};

const EntitlementsContext = createContext<EntitlementsValue | undefined>(
  undefined,
);

export function EntitlementsProvider({ children }: { children: ReactNode }) {
  const { user, configured } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id ?? null;

  const query = useQuery({
    queryKey: ["me", userId],
    queryFn: fetchMe,
    enabled: configured,
    staleTime: 30_000,
  });

  // Realtime: the Stripe webhook flips entitlements; refetch when it does so the
  // UI unlocks on the success page without a manual reload.
  useEffect(() => {
    if (!configured || !userId) return;
    const supabase = getBrowserSupabase();
    const channel = supabase
      .channel(`entitlements:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "entitlements",
          filter: `user_id=eq.${userId}`,
        },
        () => qc.invalidateQueries({ queryKey: ["me", userId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [configured, userId, qc]);

  const data = query.data;

  // Optimistic pin: write the cache immediately, persist server-side, refetch.
  function setPin(matchId: string | null) {
    qc.setQueryData<MeResponse>(["me", userId], (prev) =>
      prev ? { ...prev, pinnedMatch: matchId } : prev,
    );
    fetch("/api/me/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId }),
    })
      .catch(() => {})
      .finally(() => qc.invalidateQueries({ queryKey: ["me", userId] }));
  }

  const value: EntitlementsValue = {
    hasPersonal: data?.entitlements.hasPersonal ?? false,
    hasPro: data?.entitlements.hasPro ?? false,
    points: data?.points ?? 0,
    pinnedMatch: data?.pinnedMatch ?? null,
    setPin,
    loading: configured ? query.isLoading : false,
    refresh: () => qc.invalidateQueries({ queryKey: ["me", userId] }),
  };

  return (
    <EntitlementsContext.Provider value={value}>
      {children}
    </EntitlementsContext.Provider>
  );
}

export function useEntitlements(): EntitlementsValue {
  const ctx = useContext(EntitlementsContext);
  if (!ctx)
    throw new Error("useEntitlements must be used within <EntitlementsProvider>");
  return ctx;
}
