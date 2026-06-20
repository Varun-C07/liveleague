"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTheme } from "@/components/design/theme";
import { GlobalStyle } from "@/components/design/GlobalStyle";
import { hex } from "@/components/design/primitives";
import { Radio, Trophy, Zap, Bell, Check, ChevronDown } from "@/components/design/icons";
import { Logo } from "@/components/design/Logo";
import { AuthModalProvider, useAuthModal } from "@/components/design/auth/AuthModalProvider";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";

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
    <AuthModalProvider>
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
        <div className="ll-head">
          <Logo />
          <Nav active={active} />
          <ShellBell />
          <ShellAuth />
        </div>
      </div>

      <div className="wrap lldesign">{children}</div>

      <Footer />
    </AuthModalProvider>
  );
}

// Top nav: inline pills on desktop; on mobile (≤640px) collapses to a single
// tap-to-open menu showing the current page, expanding to switch between sections.
function Nav({ active }: { active: string }) {
  const { t } = useTheme();
  const path = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Collapse the menu whenever the route changes.
  useEffect(() => setOpen(false), [path]);

  const current = PILLS.find((p) => p.id === active) ?? PILLS[0];

  return (
    <div style={{ flex: 1, minWidth: 0, marginLeft: 6 }}>
      {/* Desktop: inline pills */}
      <div className="ll-nav-pills">
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

      {/* Mobile: collapsible menu */}
      <div className="ll-nav-menu" ref={ref}>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="Switch section"
          style={{
            display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 13px",
            border: "none", borderRadius: 9, cursor: "pointer", fontSize: 13, fontWeight: 700,
            whiteSpace: "nowrap", background: t.accent, color: t.onAccent,
            boxShadow: `0 4px 16px ${hex(t.accent, 0.38)}`,
          }}
        >
          {current.icon}
          {current.label}
          <ChevronDown size={14} style={{ transition: "transform .2s ease", transform: open ? "rotate(180deg)" : "none" }} />
        </button>

        {open && (
          <div
            className="rise"
            style={{ position: "absolute", top: 44, left: 0, minWidth: 184, zIndex: 80, borderRadius: 11, border: `1px solid ${hex(t.border, 0.7)}`, background: t.surface, boxShadow: t.shadow, padding: 6 }}
          >
            {PILLS.map((p) => {
              const on = active === p.id;
              return (
                <Link
                  key={p.id}
                  href={p.href}
                  onClick={() => setOpen(false)}
                  aria-current={on ? "page" : undefined}
                  style={{
                    display: "flex", alignItems: "center", gap: 9, padding: "10px 12px", borderRadius: 8,
                    textDecoration: "none", fontSize: 13.5, fontWeight: 700,
                    background: on ? hex(t.accent, 0.14) : "transparent",
                    color: on ? t.accent : t.textDim,
                  }}
                >
                  {p.icon}
                  {p.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function timeAgo(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function ShellBell() {
  const { t } = useTheme();
  const { user, configured } = useAuth();
  const { notifications, unread, markRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  if (!configured || !user) return null;

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) markRead(); // mark all read on open
  }

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={toggle}
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
        style={{ position: "relative", display: "grid", placeItems: "center", width: 36, height: 36, borderRadius: 9, border: `1px solid ${hex(t.border, 0.7)}`, background: open ? t.chip : "transparent", color: t.textDim, cursor: "pointer" }}
      >
        <Bell size={16} />
        {unread > 0 && (
          <span style={{ position: "absolute", top: 4, right: 4, minWidth: 15, height: 15, padding: "0 3px", borderRadius: 8, background: t.live, color: "#fff", fontSize: 9.5, fontWeight: 800, display: "grid", placeItems: "center", lineHeight: 1 }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="rise" style={{ position: "absolute", top: 44, right: 0, width: 320, maxHeight: 420, overflowY: "auto", zIndex: 80, borderRadius: 12, border: `1px solid ${hex(t.border, 0.7)}`, background: t.surface, boxShadow: t.shadow, padding: 6 }}>
          <div style={{ padding: "8px 10px 6px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", color: t.textDim }}>Alerts</div>
          {notifications.length === 0 ? (
            <div style={{ padding: "18px 12px", fontSize: 12.5, color: t.textFaint, lineHeight: 1.5 }}>
              No alerts yet. Follow teams to get kick-off and full-time notifications for their matches.
            </div>
          ) : (
            notifications.map((n) => (
              <Link
                key={n.id}
                href={(n.payload?.href as string) ?? "/soccer"}
                onClick={() => setOpen(false)}
                style={{ display: "block", padding: "9px 10px", borderRadius: 8, textDecoration: "none", color: t.text }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: n.type === "kickoff" ? t.live : t.win, flexShrink: 0 }} />
                  <span style={{ fontSize: 12.5, fontWeight: 700, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.title}</span>
                  <span style={{ fontSize: 10.5, color: t.textFaint, flexShrink: 0 }}>{timeAgo(n.created_at)}</span>
                </div>
                <div style={{ fontSize: 11.5, color: t.textDim, paddingLeft: 13 }}>{n.body}</div>
              </Link>
            ))
          )}
          {notifications.length > 0 && (
            <button
              onClick={() => markRead()}
              style={{ width: "100%", marginTop: 4, padding: "8px", border: "none", background: "transparent", color: t.textDim, fontSize: 11.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
            >
              <Check size={12} /> Mark all read
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ShellAuth() {
  const { t } = useTheme();
  const { user, configured } = useAuth();
  const { openAuth } = useAuthModal();

  if (configured && user) {
    const name =
      (user.user_metadata?.name as string | undefined) ||
      (user.user_metadata?.full_name as string | undefined) ||
      user.email ||
      "Account";
    const avatar = user.user_metadata?.avatar_url as string | undefined;
    return (
      <Link href="/account" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: t.text, flexShrink: 0 }}>
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" referrerPolicy="no-referrer" style={{ width: 28, height: 28, borderRadius: "50%", border: `1px solid ${t.border}` }} />
        ) : (
          <span style={{ width: 28, height: 28, borderRadius: "50%", display: "grid", placeItems: "center", background: hex(t.accent, 0.18), color: t.accent, fontWeight: 800, fontSize: 13 }}>
            {name.trim().charAt(0).toUpperCase()}
          </span>
        )}
        <span className="ll-acct-name" style={{ fontSize: 13, fontWeight: 700, maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
      </Link>
    );
  }

  // Single outline button; the modal carries both Sign in / Create account tabs.
  return (
    <button
      onClick={() => openAuth("signin")}
      style={{ padding: "8px 16px", borderRadius: 9, border: `1.5px solid ${hex(t.accent, 0.6)}`, background: "transparent", color: t.accent, cursor: "pointer", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}
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
