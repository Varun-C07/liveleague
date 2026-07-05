import "server-only";

import type { User } from "@supabase/supabase-js";
import { getServerSupabase, getSessionUser } from "@/lib/db/supabase-server";
import { PAYWALL_ENABLED, type Entitlements } from "@liveleagues/core/gating";

// Authority for feature gating. Reads the user's own entitlements row (RLS
// scopes it). The webhook is the only writer. While the paywall is off, everyone
// is fully entitled (the require* gates below then pass for any signed-in user).
export async function getEntitlements(): Promise<Entitlements> {
  if (!PAYWALL_ENABLED) return { hasPersonal: true, hasPro: true };
  const user = await getSessionUser();
  if (!user) return { hasPersonal: false, hasPro: false };
  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from("entitlements")
    .select("has_personal, has_pro")
    .eq("user_id", user.id)
    .maybeSingle();
  return {
    hasPersonal: data?.has_personal ?? false,
    hasPro: data?.has_pro ?? false,
  };
}

export class GateError extends Error {
  constructor(public code: "unauthenticated" | "needs_personal" | "needs_pro") {
    super(code);
    this.name = "GateError";
  }
}

export async function requireUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) throw new GateError("unauthenticated");
  return user;
}

export async function requirePersonal(): Promise<{ user: User; ent: Entitlements }> {
  const user = await requireUser();
  const ent = await getEntitlements();
  if (!ent.hasPersonal) throw new GateError("needs_personal");
  return { user, ent };
}

export async function requirePro(): Promise<{ user: User; ent: Entitlements }> {
  const user = await requireUser();
  const ent = await getEntitlements();
  if (!ent.hasPro) throw new GateError("needs_pro");
  return { user, ent };
}

// Map a GateError to a JSON Response; returns null for other errors (rethrow).
export function gateErrorResponse(e: unknown): Response | null {
  if (e instanceof GateError) {
    const status = e.code === "unauthenticated" ? 401 : 403;
    return Response.json({ error: e.code }, { status });
  }
  return null;
}
