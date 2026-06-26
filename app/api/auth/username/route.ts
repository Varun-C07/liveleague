import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/db/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Username availability check for signup. Uses the admin client because RLS
// scopes profile reads to the owner — a public lookup needs to bypass it.
const RESERVED = new Set(["admin", "messi", "ronaldo", "liveleague", "support", "root"]);
const HANDLE_RE = /^[a-z0-9_]+$/i;

export async function GET(req: Request) {
  const u = (new URL(req.url).searchParams.get("u") ?? "").trim();
  if (u.length < 3) return NextResponse.json({ available: false, reason: "At least 3 characters." });
  if (u.length > 20) return NextResponse.json({ available: false, reason: "At most 20 characters." });
  if (!HANDLE_RE.test(u)) return NextResponse.json({ available: false, reason: "Letters, numbers, underscore only." });
  if (RESERVED.has(u.toLowerCase())) return NextResponse.json({ available: false, reason: "Already taken." });

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ available: true });
  try {
    const { data } = await getAdminSupabase()
      .from("profiles")
      .select("id")
      .ilike("username", u)
      .maybeSingle();
    return NextResponse.json(data ? { available: false, reason: "Already taken." } : { available: true });
  } catch {
    return NextResponse.json({ available: true }); // fail open; the unique index is the backstop
  }
}
