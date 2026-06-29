// components/design/auth/authClient.ts
//
// Real auth client — backed by Supabase. The UI (AuthModal) imports ONLY these
// functions; on success the session is set by Supabase and the app's useAuth
// (onAuthStateChange) updates the shell. Same signatures as the old mock so the
// modal is unchanged.
import type { User } from "@supabase/supabase-js";
import { getBrowserSupabase, isSupabaseConfigured } from "@/lib/db/supabase-browser";

export type AuthUser = {
  id: string;
  email: string;
  username?: string;
  displayName?: string;
};

export type AuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; error: string };

const NOT_CONFIGURED = "Sign-in isn't available right now.";

function toUser(u: User): AuthUser {
  const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
  const username = typeof meta.username === "string" ? meta.username : undefined;
  const displayName =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    username ||
    (u.email ? u.email.split("@")[0] : undefined) ||
    undefined;
  return { id: u.id, email: u.email ?? "", username, displayName };
}

// Map Supabase auth errors to friendly copy.
function friendly(message: string | undefined): string {
  const m = (message ?? "").toLowerCase();
  if (m.includes("invalid login")) return "Wrong email or password.";
  if (m.includes("already registered") || m.includes("already exists")) return "That email is already registered.";
  if (m.includes("rate limit")) return "Too many attempts — try again in a moment.";
  return message || "Something went wrong. Please try again.";
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONFIGURED };
  const { data, error } = await getBrowserSupabase().auth.signInWithPassword({ email: email.trim(), password });
  if (error || !data.user) return { ok: false, error: friendly(error?.message) };
  return { ok: true, user: toUser(data.user) };
}

export async function signUpWithEmail(input: { email: string; password: string; username: string }): Promise<AuthResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONFIGURED };
  const { data, error } = await getBrowserSupabase().auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: { data: { username: input.username.trim() } },
  });
  if (error || !data.user) return { ok: false, error: friendly(error?.message) };
  // No session ⇒ email confirmation is required (Supabase default).
  if (!data.session) return { ok: false, error: "Account created — check your email to confirm, then sign in." };
  return { ok: true, user: toUser(data.user) };
}

export async function signInWithOAuth(provider: "google" | "apple"): Promise<AuthResult> {
  if (provider !== "google") return { ok: false, error: "Apple sign-in isn't available yet." };
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONFIGURED };
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(window.location.pathname)}`;
  const { error } = await getBrowserSupabase().auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
  // On success the browser redirects to Google; this only returns on error.
  return { ok: false, error: error ? friendly(error.message) : "" };
}

export async function checkUsernameAvailability(username: string): Promise<{ available: boolean; reason?: string }> {
  try {
    const res = await fetch(`/api/auth/username?u=${encodeURIComponent(username.trim())}`);
    if (!res.ok) return { available: true };
    return res.json();
  } catch {
    return { available: true }; // fail open; the DB unique index is the backstop
  }
}

export async function getSession(): Promise<AuthUser | null> {
  if (!isSupabaseConfigured()) return null;
  const { data } = await getBrowserSupabase().auth.getUser();
  return data.user ? toUser(data.user) : null;
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await getBrowserSupabase().auth.signOut();
}
