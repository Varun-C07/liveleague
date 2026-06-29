import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/db/supabase-server";

// OAuth redirect target: exchange the ?code for a session (sets cookies), then
// return to wherever the user started (?next), or home.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  // Only allow same-origin relative redirects.
  const dest = next.startsWith("/") ? next : "/";

  if (code) {
    const supabase = await getServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${dest}`);
  }
  return NextResponse.redirect(`${origin}/?auth_error=1`);
}
