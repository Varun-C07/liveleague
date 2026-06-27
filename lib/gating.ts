// Pure entitlement logic. No server imports, no I/O — unit-tested in tests/.
// Subscriptions drive entitlements: a flag is on while the user has an active
// (or trialing) subscription that grants it. "combo" grants both.

export type Sku = "personal" | "pro" | "combo";
export type Entitlements = { hasPersonal: boolean; hasPro: boolean };

// ── MASTER PAYWALL SWITCH ────────────────────────────────────────────────────
// Single source of truth for whether the app charges for anything. While this is
// `false`, every paid feature is free for everyone (entitlements report unlocked,
// server gates pass, "$5/$20 bundle" promos are hidden) — but all the Stripe /
// entitlements / gating code stays in place. Flip back to `true` to re-enable the
// paywall with zero other changes. Client-safe (this module has no server imports).
export const PAYWALL_ENABLED = false;

const ACTIVE_STATUSES = new Set(["active", "trialing"]);

export function entitlementsForSku(sku: Sku): Entitlements {
  return {
    hasPersonal: sku === "personal" || sku === "combo",
    hasPro: sku === "pro" || sku === "combo",
  };
}

// Recompute a user's flags from all their subscription rows. Idempotent:
// re-running over the same set yields the same result.
export function entitlementsFromSubs(
  subs: { sku: Sku; status: string }[],
): Entitlements {
  let hasPersonal = false;
  let hasPro = false;
  for (const s of subs) {
    if (!ACTIVE_STATUSES.has(s.status)) continue;
    const e = entitlementsForSku(s.sku);
    hasPersonal = hasPersonal || e.hasPersonal;
    hasPro = hasPro || e.hasPro;
  }
  return { hasPersonal, hasPro };
}

// Feature predicates (UX + server gating share these).
export function canSubmitPrediction(e: Entitlements): boolean {
  return e.hasPersonal;
}
export function canViewPro(e: Entitlements): boolean {
  return e.hasPro;
}
export function showAds(e: Entitlements): boolean {
  return !e.hasPro;
}
