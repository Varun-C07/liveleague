"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";
import type { Sku } from "@/lib/gating";

const PLANS: { sku: Sku; name: string; price: string; blurb: string }[] = [
  {
    sku: "personal",
    name: "Personal",
    price: "$5/mo",
    blurb:
      "Follow your teams, match predictor, friend leagues, group tracker, kickoff & full-time alerts.",
  },
  {
    sku: "pro",
    name: "Pro",
    price: "$20/mo",
    blurb:
      "Team profiles, head-to-head history, full stats dashboard, all-group qualification tracker, ad-free.",
  },
  {
    sku: "combo",
    name: "Combo",
    price: "$22/mo",
    blurb: "Everything in Personal + Pro — the full Live League experience.",
  },
];

export default function AccountPage() {
  const { user, loading: authLoading, configured, signInWithGoogle } = useAuth();
  const { hasPersonal, hasPro, points, refresh } = useEntitlements();
  const [busy, setBusy] = useState<Sku | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("checkout");
    if (p === "success") {
      setBanner("Subscription active — thanks! Unlocking your plan…");
      refresh();
    } else if (p === "cancel") {
      setBanner("Checkout canceled — no charge was made.");
    }
  }, [refresh]);

  async function subscribe(sku: Sku) {
    setBusy(sku);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setBanner(`Could not start checkout: ${data.error ?? "unknown error"}`);
    } catch {
      setBanner("Could not start checkout. Please try again.");
    }
    setBusy(null);
  }

  const owns = (sku: Sku) =>
    (sku === "personal" && hasPersonal) ||
    (sku === "pro" && hasPro) ||
    (sku === "combo" && hasPersonal && hasPro);

  return (
    <div className="max-w-[760px] mx-auto px-4 py-8">
      <h1 className="ff-cond font-bold uppercase tracking-[0.12em] text-2xl">
        Your account
      </h1>

      {banner ? (
        <div className="mt-4 rounded-lg border border-line2 px-4 py-3 text-sm text-muted">
          {banner}
        </div>
      ) : null}

      {!configured ? (
        <p className="mt-6 text-muted">Backend is not configured yet.</p>
      ) : authLoading ? (
        <p className="mt-6 text-dim">…</p>
      ) : !user ? (
        <div className="mt-6">
          <p className="text-muted">Sign in to manage your plan.</p>
          <button
            onClick={signInWithGoogle}
            className="mt-3 rounded-full border px-4 py-2 ff-cond uppercase tracking-wide font-semibold text-sm"
            style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
          >
            Sign in with Google
          </button>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
            <Status label="Personal" on={hasPersonal} />
            <Status label="Pro" on={hasPro} />
            <span className="text-muted">
              Prediction points: <b className="text-text">{points}</b>
            </span>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {PLANS.map((plan) => {
              const have = owns(plan.sku);
              return (
                <div
                  key={plan.sku}
                  className="rounded-xl border border-line2 p-4 flex flex-col"
                >
                  <div className="flex items-baseline justify-between">
                    <span className="ff-cond font-bold uppercase tracking-wide">
                      {plan.name}
                    </span>
                    <span className="ff-mono text-sm text-muted">
                      {plan.price}
                    </span>
                  </div>
                  <p className="mt-2 text-[13px] text-muted flex-1">
                    {plan.blurb}
                  </p>
                  <button
                    disabled={have || busy !== null}
                    onClick={() => subscribe(plan.sku)}
                    className="mt-4 rounded-full border px-3 py-2 ff-cond uppercase tracking-wide font-semibold text-[12px] transition disabled:opacity-50"
                    style={{
                      borderColor: have ? "var(--line2)" : "var(--accent)",
                      color: have ? "var(--dim)" : "var(--accent)",
                      background: have
                        ? "transparent"
                        : "color-mix(in srgb, var(--accent) 14%, transparent)",
                    }}
                  >
                    {have
                      ? "Active"
                      : busy === plan.sku
                        ? "Redirecting…"
                        : "Subscribe"}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function Status({ label, on }: { label: string; on: boolean }) {
  return (
    <span
      className="rounded-full border px-2.5 py-1 ff-cond uppercase tracking-wide text-[11px] font-semibold"
      style={{
        borderColor: on ? "var(--accent)" : "var(--line2)",
        color: on ? "var(--accent)" : "var(--dim)",
      }}
    >
      {label}: {on ? "on" : "off"}
    </span>
  );
}
