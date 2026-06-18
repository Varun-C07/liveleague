import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/db/supabase-server";
import { getAdminSupabase } from "@/lib/db/supabase-admin";
import { getStripe } from "@/lib/stripe/client";
import { priceForSku, isSku } from "@/lib/stripe/skus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Create a Stripe subscription Checkout Session for the signed-in user.
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  let body: { sku?: unknown };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  if (!isSku(body.sku)) {
    return NextResponse.json({ error: "bad_sku" }, { status: 400 });
  }
  const price = priceForSku(body.sku);
  if (!price) {
    return NextResponse.json({ error: "price_not_configured" }, { status: 500 });
  }

  const stripe = getStripe();
  const admin = getAdminSupabase();

  // Reuse or create the Stripe customer, stored on the profile.
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  let customerId = profile?.stripe_customer_id ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
    await admin
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price, quantity: 1 }],
    client_reference_id: user.id,
    metadata: { user_id: user.id, sku: body.sku },
    subscription_data: { metadata: { user_id: user.id, sku: body.sku } },
    success_url: `${origin}/account?checkout=success`,
    cancel_url: `${origin}/account?checkout=cancel`,
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
