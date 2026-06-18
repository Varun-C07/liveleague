import "server-only";

import type { Sku } from "@/lib/gating";

// Map SKU <-> Stripe Price ID, from env. Single source of truth for checkout
// (sku -> price) and the webhook (price -> sku).
const PRICE: Record<Sku, string | undefined> = {
  personal: process.env.STRIPE_PRICE_PERSONAL,
  pro: process.env.STRIPE_PRICE_PRO,
  combo: process.env.STRIPE_PRICE_COMBO,
};

export function priceForSku(sku: Sku): string | undefined {
  return PRICE[sku];
}

export function skuForPrice(priceId: string | null | undefined): Sku | null {
  if (!priceId) return null;
  for (const sku of ["personal", "pro", "combo"] as Sku[]) {
    if (PRICE[sku] === priceId) return sku;
  }
  return null;
}

export function isSku(v: unknown): v is Sku {
  return v === "personal" || v === "pro" || v === "combo";
}
