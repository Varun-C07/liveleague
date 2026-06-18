"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

// Header auth control. Renders nothing until Supabase is configured, so the
// public app is visually unchanged before backend keys exist.
export function AuthControl() {
  const { user, loading, configured, signInWithGoogle, signOut } = useAuth();
  if (!configured) return null;

  const pill =
    "flex-none flex items-center gap-1.5 rounded-full border px-3 py-1.5 ff-cond uppercase tracking-wide font-semibold text-[12px] transition";

  if (loading) {
    return (
      <div
        className={pill}
        style={{ borderColor: "var(--line2)", color: "var(--dim)" }}
        aria-hidden
      >
        …
      </div>
    );
  }

  if (!user) {
    return (
      <button
        onClick={signInWithGoogle}
        className={pill}
        style={{
          borderColor: "var(--accent)",
          color: "var(--accent)",
          background: "color-mix(in srgb, var(--accent) 14%, transparent)",
        }}
      >
        Sign in
      </button>
    );
  }

  const name =
    (user.user_metadata?.name as string | undefined) ||
    (user.user_metadata?.full_name as string | undefined) ||
    user.email ||
    "Account";
  const avatar =
    (user.user_metadata?.avatar_url as string | undefined) ||
    (user.user_metadata?.picture as string | undefined);

  return (
    <div className="flex-none flex items-center gap-2">
      <Avatar src={avatar} name={name} />
      <span className="ff-cond text-[12px] text-muted max-w-[120px] truncate hidden sm:block">
        {name}
      </span>
      <button
        onClick={signOut}
        className="flex-none rounded-full border border-line2 px-2.5 py-1.5 ff-cond uppercase tracking-wide font-semibold text-[11px] text-dim hover:text-text transition"
      >
        Sign out
      </button>
    </div>
  );
}

function Avatar({ src, name }: { src?: string; name: string }) {
  const [broken, setBroken] = useState(false);
  if (src && !broken) {
    return (
      // referrerPolicy=no-referrer is required for Google (lh3.googleusercontent.com)
      // profile images to load; onError falls back to initials.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className="w-6 h-6 rounded-full border border-line2 object-cover"
      />
    );
  }
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      aria-hidden
      className="w-6 h-6 rounded-full grid place-items-center text-[11px] ff-cond font-bold border border-line2"
      style={{
        background: "color-mix(in srgb, var(--accent) 18%, transparent)",
        color: "var(--accent)",
      }}
    >
      {initial}
    </span>
  );
}
