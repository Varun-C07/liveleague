"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useTheme } from "@/components/design/theme";
import { GlobalStyle } from "@/components/design/GlobalStyle";
import { hex, Pulse } from "@/components/design/primitives";
import { Radio, Trophy, Zap } from "@/components/design/icons";
import { useAuth } from "@/hooks/useAuth";

const PILLS = [
  { id: "home", href: "/", label: "Home", icon: <Radio size={14} /> },
  { id: "soccer", href: "/soccer", label: "World Cup", icon: <Trophy size={14} /> },
  { id: "f1", href: "/f1", label: "Formula 1", icon: <Zap size={14} /> },
];

function activeId(path: string): string {
  if (path === "/") return "home";
  if (path.startsWith("/soccer")) return "soccer";
  if (path.startsWith("/f1")) return "f1";
  return "";
}

export function DesignShell({ children }: { children: ReactNode }) {
  const { t } = useTheme();
  const path = usePathname() || "/";
  const active = activeId(path);

  return (
    <>
      <GlobalStyle />
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 60,
          background: hex(t.bg, 0.82),
          backdropFilter: "blur(14px)",
          borderBottom: `1px solid ${hex(t.border, 0.6)}`,
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "11px 22px", display: "flex", alignItems: "center", gap: 16 }}>
          <Logo />
          <div style={{ display: "flex", gap: 4, marginLeft: 6, flex: 1, overflowX: "auto" }}>
            {PILLS.map((p) => {
              const on = active === p.id;
              return (
                <Link
                  key={p.id}
                  href={p.href}
                  aria-current={on ? "page" : undefined}
                  className={on ? "" : "navpill"}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "8px 15px",
                    border: "none", borderRadius: 9, cursor: "pointer", fontSize: 13,
                    fontWeight: 700, whiteSpace: "nowrap", transition: "all .2s", textDecoration: "none",
                    background: on ? t.accent : "transparent",
                    boxShadow: on ? `0 4px 16px ${hex(t.accent, 0.38)}` : "none",
                    color: on ? t.onAccent : t.textDim,
                  }}
                >
                  {p.icon}
                  {p.label}
                </Link>
              );
            })}
          </div>
          <ShellAuth />
        </div>
      </div>

      <div className="wrap lldesign">{children}</div>

      <Footer />
    </>
  );
}

function Logo() {
  const { t } = useTheme();
  return (
    <Link href="/" style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
      <div style={{ position: "relative", width: 34, height: 30, display: "flex", alignItems: "flex-end", gap: 2.5 }}>
        {[14, 22, 30, 18].map((h, i) => (
          <div key={i} style={{ width: 5, height: h, background: i === 2 ? t.accent : t.text, transform: "skewX(-10deg)", borderRadius: 1 }} />
        ))}
        <span style={{ position: "absolute", top: -2, right: -3 }}>
          <Pulse color={t.live} size={6} />
        </span>
      </div>
      <span className="disp" style={{ fontSize: 23, fontWeight: 800, color: t.text }}>
        LIVE<span style={{ color: t.accent }}>LEAGUE</span>
      </span>
    </Link>
  );
}

function ShellAuth() {
  const { t } = useTheme();
  const { user, configured, signInWithGoogle } = useAuth();

  if (configured && user) {
    const name =
      (user.user_metadata?.name as string | undefined) ||
      (user.user_metadata?.full_name as string | undefined) ||
      user.email ||
      "Account";
    const avatar = user.user_metadata?.avatar_url as string | undefined;
    return (
      <Link href="/account" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: t.text }}>
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" referrerPolicy="no-referrer" style={{ width: 28, height: 28, borderRadius: "50%", border: `1px solid ${t.border}` }} />
        ) : (
          <span style={{ width: 28, height: 28, borderRadius: "50%", display: "grid", placeItems: "center", background: hex(t.accent, 0.18), color: t.accent, fontWeight: 800, fontSize: 13 }}>
            {name.trim().charAt(0).toUpperCase()}
          </span>
        )}
        <span style={{ fontSize: 13, fontWeight: 700, maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
      </Link>
    );
  }

  return (
    <button
      onClick={() => configured && signInWithGoogle()}
      style={{ padding: "8px 16px", borderRadius: 9, border: `1.5px solid ${hex(t.accent, 0.6)}`, background: "transparent", color: t.accent, cursor: "pointer", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}
    >
      Sign in
    </button>
  );
}

function Footer() {
  const { t } = useTheme();
  return (
    <div style={{ borderTop: `1px solid ${hex(t.border, 0.6)}`, padding: "22px", textAlign: "center", fontSize: 11.5, color: t.textFaint }}>
      Live League · World Cup &amp; Formula 1 · live data from TheSportsDB and Jolpica.
    </div>
  );
}
