"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getBrowserSupabase } from "@/lib/db/supabase-browser";
import { useAuth } from "@/hooks/useAuth";

export type Notification = {
  id: string;
  type: "kickoff" | "fulltime";
  sport: string;
  match_id: string;
  title: string;
  body: string;
  payload: Record<string, unknown>;
  created_at: string;
  read_at: string | null;
};

type NotificationsResponse = { notifications: Notification[]; unread: number };

async function fetchNotifications(): Promise<NotificationsResponse> {
  const res = await fetch("/api/notifications");
  if (!res.ok) throw new Error("notifications_failed");
  return res.json();
}

// In-app notification feed: the user's recent kickoff / full-time alerts, the
// unread count, and a markRead action. Polls slowly and refetches instantly
// when a new row lands (Realtime), so the bell badge stays live.
export function useNotifications() {
  const { user, configured } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id ?? null;

  const query = useQuery({
    queryKey: ["notifications", userId],
    queryFn: fetchNotifications,
    enabled: configured && !!userId,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (!configured || !userId) return;
    const supabase = getBrowserSupabase();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => qc.invalidateQueries({ queryKey: ["notifications", userId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [configured, userId, qc]);

  const markRead = useMutation({
    mutationFn: async (ids?: string[]) => {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ids ? { ids } : {}),
      });
      if (!res.ok) throw new Error("mark_read_failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", userId] }),
  });

  return {
    notifications: query.data?.notifications ?? [],
    unread: query.data?.unread ?? 0,
    loading: configured && !!userId ? query.isLoading : false,
    markRead: (ids?: string[]) => markRead.mutate(ids),
  };
}
