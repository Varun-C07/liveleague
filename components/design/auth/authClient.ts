// components/design/auth/authClient.ts
//
// BACKEND SEAM — mock auth client.
// This entire module is a stub. A partner can swap in Supabase by replacing each
// function body (every one is marked "// BACKEND SEAM: replace with Supabase").
// The UI imports ONLY these functions and never talks to a backend directly, so
// the swap stays a small change, not a rewrite.

export type AuthUser = {
  id: string;
  email: string;
  username?: string;
  displayName?: string;
};

export type AuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; error: string };

// Mocked network latency so the UI's loading states are visible/realistic.
const MOCK_DELAY = 700;
const wait = (ms: number = MOCK_DELAY): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Deterministic "taken" set for the username checker.
const RESERVED_USERNAMES = new Set(["admin", "messi", "ronaldo", "liveleague"]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let _seq = 0;
const mockId = (): string => `mock_${Date.now().toString(36)}_${(_seq++).toString(36)}`;

function buildUser(email: string, username?: string): AuthUser {
  return {
    id: mockId(),
    email,
    username,
    displayName: username || email.split("@")[0],
  };
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthResult> {
  await wait();
  // BACKEND SEAM: replace with supabase.auth.signInWithPassword({ email, password }).
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Enter a valid email address." };
  if (!password || password.length < 6)
    return { ok: false, error: "Password must be at least 6 characters." };
  return { ok: true, user: buildUser(email) };
}

export async function signUpWithEmail(input: {
  email: string;
  password: string;
  username: string;
}): Promise<AuthResult> {
  await wait();
  // BACKEND SEAM: replace with supabase.auth.signUp({ email, password, options: { data: { username } } }).
  const email = input.email.trim();
  const username = input.username.trim();
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Enter a valid email address." };
  if (!input.password || input.password.length < 6)
    return { ok: false, error: "Password must be at least 6 characters." };
  if (username.length < 3 || RESERVED_USERNAMES.has(username.toLowerCase()))
    return { ok: false, error: "That username isn't available." };
  return { ok: true, user: buildUser(email, username) };
}

export async function signInWithOAuth(
  provider: "google" | "apple",
): Promise<AuthResult> {
  await wait();
  // BACKEND SEAM: replace with supabase.auth.signInWithOAuth({ provider }) + redirect handling.
  const email = provider === "google" ? "you@gmail.com" : "you@icloud.com";
  return { ok: true, user: buildUser(email) };
}

export async function checkUsernameAvailability(
  username: string,
): Promise<{ available: boolean; reason?: string }> {
  await wait(600);
  // BACKEND SEAM: replace with a profiles lookup (select where username = …, or an RPC).
  const u = username.trim().toLowerCase();
  if (u.length < 3) return { available: false, reason: "At least 3 characters." };
  if (RESERVED_USERNAMES.has(u)) return { available: false, reason: "Already taken." };
  return { available: true };
}

export async function getSession(): Promise<AuthUser | null> {
  await wait(150);
  // BACKEND SEAM: replace with supabase.auth.getUser() → map to AuthUser (or null).
  return null;
}

export async function signOut(): Promise<void> {
  await wait(200);
  // BACKEND SEAM: replace with supabase.auth.signOut().
}
