"use client";

import type { ReactNode } from "react";
import { useEntitlements } from "@/hooks/useEntitlements";

// Presentational gate. Cosmetic only — the real enforcement is server-side in
// API routes / server components via requirePersonal/requirePro.
export function Gate({
  need,
  children,
  fallback = null,
}: {
  need: "personal" | "pro";
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { hasPersonal, hasPro, loading } = useEntitlements();
  if (loading) return null;
  const ok = need === "pro" ? hasPro : hasPersonal;
  return <>{ok ? children : fallback}</>;
}
