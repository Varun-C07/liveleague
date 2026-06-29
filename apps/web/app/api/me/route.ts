import { NextResponse } from "next/server";
import { getServerSupabase, getSessionUser } from "@/lib/db/supabase-server";
import { PAYWALL_ENABLED } from "@liveleague/core/gating";

export const dynamic = "force-dynamic";

// Client bootstrap: who am I + what have I unlocked. Returns a safe default for
// signed-out users (and before Supabase is configured).
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({
      user: null,
      entitlements: { hasPersonal: false, hasPro: false },
      points: 0,
      pinnedMatch: null,
    });
  }

  const supabase = await getServerSupabase();
  const [{ data: ent }, { data: profile }] = await Promise.all([
    supabase
      .from("entitlements")
      .select("has_personal, has_pro")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("display_name, avatar_url, prediction_points, pinned_match")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email ?? null,
      displayName: profile?.display_name ?? null,
      avatarUrl: profile?.avatar_url ?? null,
    },
    // Paywall off → everyone is fully entitled (the gating code stays in place).
    entitlements: {
      hasPersonal: !PAYWALL_ENABLED || (ent?.has_personal ?? false),
      hasPro: !PAYWALL_ENABLED || (ent?.has_pro ?? false),
    },
    points: profile?.prediction_points ?? 0,
    pinnedMatch: profile?.pinned_match ?? null,
  });
}
