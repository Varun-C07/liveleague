"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getBrowserSupabase } from "@/lib/db/supabase-browser";
import { useAuth } from "@/hooks/useAuth";

export type LeagueSummary = {
  id: string;
  name: string;
  joinCode: string;
  isOwner: boolean;
  myPoints: number;
};

export type LeaderboardRow = {
  userId: string;
  name: string | null;
  avatarUrl: string | null;
  points: number;
  rank: number;
  isMe: boolean;
};

export type LeagueDetail = {
  league: { id: string; name: string; joinCode: string; isOwner: boolean };
  leaderboard: LeaderboardRow[];
};

export function useMyLeagues() {
  const { user, configured } = useAuth();
  return useQuery({
    queryKey: ["leagues", user?.id ?? null],
    queryFn: async (): Promise<LeagueSummary[]> => {
      const res = await fetch("/api/leagues");
      if (!res.ok) throw new Error("leagues_failed");
      return (await res.json()).leagues ?? [];
    },
    enabled: configured && !!user,
    staleTime: 30_000,
  });
}

export function useLeague(id: string) {
  const { user, configured } = useAuth();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["league", id],
    queryFn: async (): Promise<LeagueDetail> => {
      const res = await fetch(`/api/leagues/${id}`);
      if (!res.ok) throw new Error("league_failed");
      return res.json();
    },
    enabled: configured && !!user && !!id,
    staleTime: 15_000,
  });

  // Live leaderboard: refetch when membership/points change.
  useEffect(() => {
    if (!configured || !user || !id) return;
    const supabase = getBrowserSupabase();
    const channel = supabase
      .channel(`league:${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "league_members",
          filter: `league_id=eq.${id}`,
        },
        () => qc.invalidateQueries({ queryKey: ["league", id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [configured, user, id, qc]);

  return query;
}

export function useCreateLeague() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (name: string): Promise<LeagueSummary> => {
      const res = await fetch("/api/leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "create_failed");
      return data.league;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["leagues", user?.id ?? null] }),
  });
}

export function useJoinLeague() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (joinCode: string) => {
      const res = await fetch("/api/leagues/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joinCode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "join_failed");
      return data.league as { id: string; name: string };
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["leagues", user?.id ?? null] }),
  });
}

export function useLeaveOrDeleteLeague() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/leagues/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete_failed");
      return res.json();
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["leagues", user?.id ?? null] }),
  });
}
