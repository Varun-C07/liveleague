"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useTheme, type Theme } from "@/components/design/theme";
import { hex } from "@/components/design/primitives";
import { Check, X } from "@/components/design/icons";
import { BrandMark } from "@/components/design/Logo";
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithOAuth,
  checkUsernameAvailability,
} from "@/components/design/auth/authClient";

type Mode = "signin" | "signup";
type UStatus = "idle" | "checking" | "available" | "taken";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthModal({
  open,
  mode,
  onModeChange,
  onClose,
}: {
  open: boolean;
  mode: Mode;
  onModeChange: (m: Mode) => void;
  onClose: () => void;
}) {
  const { t } = useTheme();
  const uid = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; username?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [provider, setProvider] = useState<null | "google" | "apple">(null);
  const [uStatus, setUStatus] = useState<UStatus>("idle");
  const [uReason, setUReason] = useState<string | undefined>();

  const cardRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  // Body scroll lock + autofocus first field while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const id = window.setTimeout(() => firstFieldRef.current?.focus(), 40);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(id);
    };
  }, [open]);

  // Live username availability — debounced; only on the Create-account tab.
  useEffect(() => {
    if (!open || mode !== "signup") {
      setUStatus("idle");
      setUReason(undefined);
      return;
    }
    const u = username.trim();
    if (u.length === 0) {
      setUStatus("idle");
      setUReason(undefined);
      return;
    }
    if (u.length < 3) {
      setUStatus("taken");
      setUReason("At least 3 characters.");
      return;
    }
    setUStatus("checking");
    let active = true;
    const id = window.setTimeout(async () => {
      const res = await checkUsernameAvailability(u);
      if (!active) return;
      if (res.available) {
        setUStatus("available");
        setUReason(undefined);
      } else {
        setUStatus("taken");
        setUReason(res.reason);
      }
    }, 450);
    return () => {
      active = false;
      window.clearTimeout(id);
    };
  }, [username, mode, open]);

  function reset() {
    setEmail("");
    setPassword("");
    setUsername("");
    setErrors({});
    setFormError(null);
    setSubmitting(false);
    setProvider(null);
    setUStatus("idle");
    setUReason(undefined);
  }

  function onSuccess() {
    // Supabase has set the session; the app's useAuth (onAuthStateChange) updates
    // the shell to the signed-in state. Just reset + close.
    reset();
    onClose();
  }

  function switchMode(m: Mode) {
    if (m === mode) return;
    setErrors({});
    setFormError(null);
    setUStatus("idle");
    setUReason(undefined);
    onModeChange(m);
    window.setTimeout(() => firstFieldRef.current?.focus(), 0);
  }

  function validate(): boolean {
    const e: { email?: string; password?: string; username?: string } = {};
    if (!EMAIL_RE.test(email)) e.email = "Enter a valid email address.";
    if (password.length < 6) e.password = "At least 6 characters.";
    if (mode === "signup" && username.trim().length < 3) e.username = "At least 3 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setFormError(null);
    if (!validate()) return;
    if (mode === "signup" && uStatus !== "available") return;
    setSubmitting(true);
    const res =
      mode === "signin"
        ? await signInWithEmail(email, password)
        : await signUpWithEmail({ email, password, username: username.trim() });
    setSubmitting(false);
    if (res.ok) onSuccess();
    else setFormError(res.error);
  }

  async function handleOAuth(p: "google" | "apple") {
    setFormError(null);
    setProvider(p);
    const res = await signInWithOAuth(p);
    setProvider(null);
    if (res.ok) onSuccess();
    else setFormError(res.error);
  }

  // Trap focus inside the card; Esc closes.
  function onKeyDown(ev: React.KeyboardEvent) {
    if (ev.key === "Escape") {
      ev.stopPropagation();
      onClose();
      return;
    }
    if (ev.key !== "Tab") return;
    const nodes = cardRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (!nodes || nodes.length === 0) return;
    const list = Array.from(nodes).filter((el) => !el.hasAttribute("disabled"));
    if (list.length === 0) return;
    const first = list[0];
    const last = list[list.length - 1];
    if (ev.shiftKey && document.activeElement === first) {
      ev.preventDefault();
      last.focus();
    } else if (!ev.shiftKey && document.activeElement === last) {
      ev.preventDefault();
      first.focus();
    }
  }

  if (!open) return null;

  const busy = submitting || provider !== null;
  const submitDisabled = busy || (mode === "signup" && (uStatus === "checking" || uStatus === "taken"));

  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "11px 13px",
    borderRadius: 10,
    border: `1px solid ${hex(t.border, 0.9)}`,
    background: t.scheme === "light" ? t.surface : t.bg,
    color: t.text,
    fontSize: 14,
    fontFamily: "inherit",
  };

  return (
    <div
      className="ll-auth-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={onKeyDown}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: hex(t.bg, 0.72),
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        className="ll-auth-card rise"
        style={{
          position: "relative",
          // Vertical scroll (not clip) so a tall form fits short mobile viewports;
          // horizontal stays clipped for the rounded corners / brand panel.
          overflowX: "hidden",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          borderRadius: 18,
          border: `1px solid ${hex(t.border, 0.8)}`,
          background: t.surface,
          boxShadow: t.shadow,
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 3,
            width: 34,
            height: 34,
            borderRadius: 9,
            border: `1px solid ${hex(t.border, 0.7)}`,
            background: hex(t.surfaceHi, 0.65),
            color: t.textDim,
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
          }}
        >
          <X size={16} />
        </button>

        <BrandPanel t={t} titleId={`${uid}-title`} />

        {/* FORM COLUMN */}
        <div
          className="ll-auth-form"
          style={{ position: "relative", padding: "52px 30px 34px", display: "flex", flexDirection: "column", justifyContent: "center" }}
        >
          {/* Compact logo — mobile only (brand panel is hidden there) */}
          <div className="ll-auth-formlogo" style={{ display: "none", marginBottom: 18 }}>
            <BrandMark wordSize={19} />
          </div>

          {/* Segmented Sign in / Create account toggle */}
          <div
            role="tablist"
            aria-label="Authentication mode"
            style={{ display: "flex", gap: 4, padding: 4, background: t.chip, borderRadius: 11, marginBottom: 18 }}
          >
            {(["signin", "signup"] as Mode[]).map((m) => {
              const on = mode === m;
              return (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => switchMode(m)}
                  style={{
                    flex: 1,
                    padding: "9px 10px",
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: 13,
                    background: on ? t.surface : "transparent",
                    color: on ? t.text : t.textDim,
                    boxShadow: on ? t.shadow : "none",
                    transition: "background .2s, color .2s",
                  }}
                >
                  {m === "signin" ? "Sign in" : "Create account"}
                </button>
              );
            })}
          </div>

          {/* OAuth providers */}
          <div style={{ display: "grid", gap: 9 }}>
            <ProviderButton
              t={t}
              label="Continue with Google"
              loading={provider === "google"}
              disabled={busy}
              onClick={() => handleOAuth("google")}
              icon={<GoogleMark />}
            />
            <ProviderButton
              t={t}
              label="Continue with Apple"
              loading={provider === "apple"}
              disabled={busy}
              onClick={() => handleOAuth("apple")}
              icon={<AppleMark />}
            />
          </div>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
            <span style={{ flex: 1, height: 1, background: hex(t.border, 0.8) }} />
            <span style={{ fontSize: 11, color: t.textFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", whiteSpace: "nowrap" }}>
              or continue with email
            </span>
            <span style={{ flex: 1, height: 1, background: hex(t.border, 0.8) }} />
          </div>

          <form onSubmit={handleSubmit} noValidate style={{ display: "grid", gap: 13 }}>
            <Field t={t} id={`${uid}-email`} label="Email" error={errors.email}>
              <input
                ref={firstFieldRef}
                id={`${uid}-email`}
                className="ll-auth-input"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@email.com"
                value={email}
                aria-invalid={!!errors.email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
              />
            </Field>

            {mode === "signup" && (
              <Field
                t={t}
                id={`${uid}-username`}
                label="Username"
                error={errors.username}
                hint={<UsernameHint t={t} status={uStatus} reason={uReason} />}
              >
                <div style={{ position: "relative" }}>
                  <input
                    id={`${uid}-username`}
                    className="ll-auth-input"
                    type="text"
                    autoComplete="username"
                    placeholder="pick a handle"
                    value={username}
                    aria-invalid={uStatus === "taken"}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{ ...inputStyle, paddingRight: 38 }}
                  />
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", display: "grid", placeItems: "center" }}>
                    {uStatus === "checking" && <Spinner color={t.textDim} size={15} />}
                    {uStatus === "available" && <Check size={16} color={t.win} />}
                    {uStatus === "taken" && username.trim().length > 0 && <X size={16} color={t.lose} />}
                  </span>
                </div>
              </Field>
            )}

            <Field t={t} id={`${uid}-password`} label="Password" error={errors.password}>
              <input
                id={`${uid}-password`}
                className="ll-auth-input"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                placeholder={mode === "signin" ? "your password" : "at least 6 characters"}
                value={password}
                aria-invalid={!!errors.password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
              />
            </Field>

            {formError && (
              <div
                role="alert"
                style={{ fontSize: 12.5, color: t.lose, fontWeight: 600, background: hex(t.lose, 0.1), border: `1px solid ${hex(t.lose, 0.3)}`, borderRadius: 9, padding: "9px 11px" }}
              >
                {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitDisabled}
              style={{
                marginTop: 2,
                width: "100%",
                padding: "13px 18px",
                border: "none",
                borderRadius: 10,
                background: t.accent,
                color: t.onAccent,
                fontWeight: 800,
                fontSize: 14.5,
                cursor: submitDisabled ? "default" : "pointer",
                opacity: submitDisabled && !submitting ? 0.55 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 9,
                transition: "opacity .15s ease",
              }}
            >
              {submitting && <Spinner color={t.onAccent} size={16} />}
              {submitting ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: 12.5, color: t.textDim, marginTop: 16, marginBottom: 0 }}>
            {mode === "signin" ? "New to LiveLeagues? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
              style={{ background: "none", border: "none", color: t.accent, fontWeight: 700, cursor: "pointer", fontSize: 12.5, padding: 0 }}
            >
              {mode === "signin" ? "Create account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Brand panel (left column) — Obsidian base, contained corner energy, one
//    track-ribbon motif bleeding off the edges, grounded content hierarchy. ────
const TRACK = "M -24 70 C 120 130, 70 250, 196 292 C 312 330, 312 432, 224 472 C 150 506, 250 558, 312 612";

function BrandPanel({ t, titleId }: { t: Theme; titleId: string }) {
  return (
    <div
      className="ll-auth-brand"
      style={{ position: "relative", overflow: "hidden", padding: "34px 32px", display: "flex", flexDirection: "column", minHeight: 560, background: `linear-gradient(158deg, ${t.surface}, ${t.bg} 62%)` }}
    >
      <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        {/* contained corner energy — warm top-right, cool bottom-left (not a wash) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(70% 52% at 100% 0%, ${hex(t.gold, 0.16)}, transparent 60%), radial-gradient(85% 65% at 0% 100%, ${hex(t.accent, 0.22)}, transparent 62%)`,
          }}
        />
        {/* one track ribbon: neutral tarmac + dashed accent racing line, bleeding off */}
        <svg viewBox="0 0 360 560" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <path d={TRACK} fill="none" stroke={hex(t.text, 0.07)} strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" />
          <path d={TRACK} fill="none" stroke={hex(t.accent, 0.16)} strokeWidth={2.5} strokeLinecap="round" />
          <path d={TRACK} fill="none" stroke={hex(t.accent, 0.45)} strokeWidth={2} strokeDasharray="1 17" strokeLinecap="round" />
        </svg>
      </div>

      {/* logo (top) */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <BrandMark wordSize={22} />
      </div>

      {/* grounded content block (lower third) */}
      <div style={{ position: "relative", zIndex: 1, marginTop: "auto", paddingTop: 44 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 15 }}>
          <span style={{ width: 22, height: 2, background: t.accent, transform: "skewX(-24deg)" }} />
          <span className="cond" style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: ".15em", textTransform: "uppercase", color: t.textDim }}>
            World Cup · Formula 1
          </span>
        </div>
        <h2 id={titleId} className="disp" style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.03, margin: "0 0 13px", color: t.text }}>
          Every league<br />that matters.<br />
          <span style={{ color: t.accent }}>One login.</span>
        </h2>
        <p style={{ fontSize: 13.5, color: t.textDim, lineHeight: 1.6, maxWidth: 288, margin: "0 0 20px" }}>
          Predictions, private leagues and live scores — synced to whoever you follow.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {["Live scores", "Predictions", "Private leagues"].map((f) => (
            <span
              key={f}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 11px", borderRadius: 999, border: `1px solid ${hex(t.border, 0.9)}`, background: hex(t.surfaceHi, 0.5), fontSize: 11.5, fontWeight: 700, color: t.textDim }}
            >
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: t.accent }} />
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({
  t,
  id,
  label,
  error,
  hint,
  children,
}: {
  t: Theme;
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <label htmlFor={id} style={{ fontSize: 12, fontWeight: 700, color: t.textDim }}>
        {label}
      </label>
      {children}
      {error ? (
        <span style={{ fontSize: 11.5, color: t.lose, fontWeight: 600 }}>{error}</span>
      ) : (
        hint ?? null
      )}
    </div>
  );
}

function UsernameHint({ t, status, reason }: { t: Theme; status: UStatus; reason?: string }) {
  let color = t.textFaint;
  let text = "";
  if (status === "checking") text = "Checking…";
  else if (status === "available") {
    color = t.win;
    text = "Available";
  } else if (status === "taken") {
    color = t.lose;
    text = reason ?? "Already taken.";
  }
  return (
    <span aria-live="polite" style={{ fontSize: 11.5, fontWeight: 600, color, minHeight: 14 }}>
      {text}
    </span>
  );
}

function ProviderButton({
  t,
  label,
  icon,
  loading,
  disabled,
  onClick,
}: {
  t: Theme;
  label: string;
  icon: ReactNode;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        width: "100%",
        padding: "11px 14px",
        borderRadius: 10,
        border: `1px solid ${hex(t.border, 0.9)}`,
        background: t.surfaceHi,
        color: t.text,
        fontWeight: 700,
        fontSize: 13.5,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled && !loading ? 0.6 : 1,
        transition: "background .16s ease",
      }}
    >
      {loading ? <Spinner color={t.textDim} size={16} /> : icon}
      {label}
    </button>
  );
}

function Spinner({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <span
      className="ll-spin"
      aria-hidden
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        border: `2px solid ${hex(color, 0.3)}`,
        borderTopColor: color,
        flexShrink: 0,
      }}
    />
  );
}

// Brand marks. Google keeps its official logo colours (a brand asset, not theme
// tokens); Apple's silhouette uses currentColor, so it follows the theme.
function GoogleMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
      <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34A21.99 21.99 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z" />
      <path fill="#EA4335" d="M24 9.5c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 2.93 29.93.75 24 .75 15.4.75 7.96 5.68 4.34 12.87l7.35 5.7C13.42 13.37 18.27 9.5 24 9.5z" />
    </svg>
  );
}

function AppleMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.36 12.78c.03 3.02 2.65 4.02 2.68 4.04-.02.07-.42 1.43-1.38 2.84-.83 1.22-1.69 2.43-3.05 2.46-1.33.03-1.76-.79-3.28-.79-1.52 0-2 .76-3.26.81-1.31.05-2.31-1.32-3.15-2.53-1.71-2.49-3.02-7.03-1.26-10.1.87-1.52 2.43-2.49 4.12-2.51 1.29-.02 2.5.86 3.29.86.79 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.27-2.15 3.85zM13.9 4.6c.7-.85 1.17-2.03 1.04-3.2-1.01.04-2.22.67-2.94 1.52-.65.75-1.21 1.95-1.06 3.1 1.12.09 2.27-.57 2.96-1.42z" />
    </svg>
  );
}
