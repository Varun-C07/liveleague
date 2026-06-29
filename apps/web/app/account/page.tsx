"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/design/theme";
import { card, hex, carbon, unskew, Tag } from "@/components/design/primitives";
import { Check, Lock } from "@/components/design/icons";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";
import { PAYWALL_ENABLED, type Sku } from "@liveleague/core/gating";

const INK = "#14110A";

const PLANS: { sku: Sku; name: string; price: string; blurb: string; combo?: boolean }[] = [
  { sku: "personal", name: "Personal", price: "$5/mo", blurb: "Follow your teams, match predictor, friend leagues, group tracker, alerts." },
  { sku: "pro", name: "Pro", price: "$20/mo", blurb: "Team profiles, head-to-head, full stats dashboard, all-group tracker, ad-free." },
  { sku: "combo", name: "Combo", price: "$22/mo", blurb: "Everything in Personal + Pro — the whole experience.", combo: true },
];

export default function AccountPage() {
  const { t } = useTheme();
  const { user, loading: authLoading, configured, signInWithGoogle, signOut } = useAuth();
  const { hasPersonal, hasPro, points, refresh } = useEntitlements();
  const [busy, setBusy] = useState<Sku | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("checkout");
    if (p === "success") { setBanner("Subscription active — unlocking your plan…"); refresh(); }
    else if (p === "cancel") setBanner("Checkout canceled — no charge was made.");
  }, [refresh]);

  async function subscribe(sku: Sku) {
    setBusy(sku);
    try {
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sku }) });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; return; }
      setBanner(`Could not start checkout: ${data.error ?? "unknown error"}`);
    } catch { setBanner("Could not start checkout. Please try again."); }
    setBusy(null);
  }

  const owns = (sku: Sku) => (sku === "personal" && hasPersonal) || (sku === "pro" && hasPro) || (sku === "combo" && hasPersonal && hasPro);

  return (
    <div className="rise" style={{ maxWidth: 820, margin: "0 auto", padding: "32px 0 40px" }}>
      <h1 className="disp h-page" style={{ fontWeight: 800, margin: "0 0 8px" }}>Your account</h1>

      {banner ? (
        <div style={{ margin: "14px 0", padding: "12px 16px", fontSize: 13, color: t.textDim, ...card(t) }}>{banner}</div>
      ) : null}

      {!configured ? (
        <p style={{ marginTop: 18, color: t.textDim }}>Backend not configured.</p>
      ) : authLoading ? (
        <p style={{ marginTop: 18, color: t.textFaint }}>…</p>
      ) : !user ? (
        <div style={{ marginTop: 18 }}>
          <p style={{ color: t.textDim, marginBottom: 14 }}>Sign in to manage your plan.</p>
          <button onClick={signInWithGoogle} style={{ padding: "12px 22px", border: "none", background: t.accent, color: t.onAccent, fontWeight: 800, fontSize: 14, cursor: "pointer", transform: "skewX(-9deg)" }}>
            <span style={unskew}>Sign in with Google</span>
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, margin: "18px 0 6px" }}>
            {PAYWALL_ENABLED ? (
              <>
                <StatusChip t={t} label="Personal" on={hasPersonal} />
                <StatusChip t={t} label="Pro" on={hasPro} />
              </>
            ) : null}
            <span style={{ fontSize: 13, color: t.textDim }}>Prediction points: <b className="num" style={{ color: t.text }}>{points}</b></span>
            <button onClick={signOut} style={{ marginLeft: "auto", padding: "7px 14px", borderRadius: 8, border: `1px solid ${t.border}`, background: "transparent", color: t.textDim, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Sign out</button>
          </div>

          {!PAYWALL_ENABLED ? (
            <div style={{ marginTop: 22, padding: "18px 20px", ...card(t) }}>
              <div className="disp" style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Everything&apos;s free right now</div>
              <p style={{ fontSize: 13, color: t.textDim, lineHeight: 1.6, margin: 0 }}>
                All features — the match predictor, win probability, friend leagues, following
                teams and alerts — are unlocked for everyone. No subscription needed.
              </p>
            </div>
          ) : (
          <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 14 }}>
            {PLANS.map((plan) => {
              const have = owns(plan.sku);
              const onCombo = plan.combo;
              return (
                <div key={plan.sku} style={{ padding: 18, display: "flex", flexDirection: "column", color: onCombo ? INK : t.text, ...(onCombo ? { background: carbon(t.gold), borderRadius: 14, boxShadow: `inset 0 2px 12px ${hex("#000", 0.16)}, ${t.shadow}` } : card(t)) }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                    <span className="disp" style={{ fontSize: 22, fontWeight: 800 }}>{plan.name}</span>
                    <span className="num" style={{ fontSize: 14, fontWeight: 700, opacity: 0.85 }}>{plan.price}</span>
                  </div>
                  <p style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.55, flex: 1, opacity: onCombo ? 0.82 : 1, color: onCombo ? INK : t.textDim }}>{plan.blurb}</p>
                  <button
                    disabled={have || busy !== null}
                    onClick={() => subscribe(plan.sku)}
                    style={{ marginTop: 14, padding: "10px 14px", border: "none", cursor: have ? "default" : "pointer", fontWeight: 800, fontSize: 13, transform: have ? "none" : "skewX(-9deg)", background: have ? (onCombo ? hex("#000", 0.12) : t.chip) : onCombo ? INK : t.accent, color: have ? (onCombo ? INK : t.textDim) : onCombo ? t.gold : t.onAccent, opacity: busy && busy !== plan.sku ? 0.5 : 1 }}
                  >
                    {have ? (<><Check size={13} style={{ verticalAlign: -2 }} /> Active</>) : (
                      <span style={unskew}><Lock size={13} />{busy === plan.sku ? "Redirecting…" : "Subscribe"}</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
          )}
        </>
      )}
    </div>
  );
}

function StatusChip({ t, label, on }: { t: ReturnType<typeof useTheme>["t"]; label: string; on: boolean }) {
  return (
    <Tag color={on ? t.onAccent : t.textDim} bg={on ? t.accent : t.chip}>
      {label}: {on ? "on" : "off"}
    </Tag>
  );
}
