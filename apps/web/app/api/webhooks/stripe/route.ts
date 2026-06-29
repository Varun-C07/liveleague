import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { getAdminSupabase } from "@/lib/db/supabase-admin";
import { skuForPrice } from "@/lib/stripe/skus";
import { entitlementsFromSubs, type Sku } from "@liveleague/core/gating";
import type { SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stripe subscription webhook. Verifies the signature against the RAW body,
// then keeps the subscriptions table + entitlements in sync. Idempotent:
// entitlements are recomputed from the full subscription set, not incremented.
export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();

  if (!secret || !sig) {
    return Response.json({ error: "webhook_not_configured" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch {
    return Response.json({ error: "bad_signature" }, { status: 400 });
  }

  const admin = getAdminSupabase();

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      await syncSubscription(admin, stripe, event.data.object as Stripe.Subscription);
      break;
    }
    default:
      break;
  }

  return Response.json({ received: true });
}

async function syncSubscription(
  admin: SupabaseClient,
  stripe: Stripe,
  sub: Stripe.Subscription,
) {
  const priceId = sub.items.data[0]?.price.id ?? null;
  const sku: Sku | null =
    (sub.metadata?.sku as Sku | undefined) ?? skuForPrice(priceId);

  // Resolve the user: prefer subscription metadata, else look up by customer id.
  let userId = sub.metadata?.user_id ?? null;
  if (!userId) {
    const customerId =
      typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    userId = data?.id ?? null;
  }
  if (!userId || !sku) return;

  // current_period_end lives on the item in newer API versions; fall back to the
  // subscription-level field for older ones.
  const item = sub.items.data[0] as unknown as { current_period_end?: number };
  const periodEnd =
    item?.current_period_end ??
    (sub as unknown as { current_period_end?: number }).current_period_end ??
    null;

  await admin.from("subscriptions").upsert({
    id: sub.id,
    user_id: userId,
    sku,
    status: sub.status,
    price_id: priceId,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: sub.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  });

  await recomputeEntitlements(admin, userId);
}

async function recomputeEntitlements(admin: SupabaseClient, userId: string) {
  const { data: subs } = await admin
    .from("subscriptions")
    .select("sku, status")
    .eq("user_id", userId);
  const ent = entitlementsFromSubs((subs ?? []) as { sku: Sku; status: string }[]);
  await admin.from("entitlements").upsert({
    user_id: userId,
    has_personal: ent.hasPersonal,
    has_pro: ent.hasPro,
    updated_at: new Date().toISOString(),
  });
}
