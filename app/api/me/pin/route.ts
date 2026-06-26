import { NextResponse } from "next/server";
import { getServerSupabase, getSessionUser } from "@/lib/db/supabase-server";

export const dynamic = "force-dynamic";

// Set or clear the signed-in user's pinned match. Body: { matchId: string | null }.
// RLS scopes the update to the user's own profile row.
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  let matchId: string | null = null;
  try {
    const body = await req.json();
    if (typeof body?.matchId === "string") matchId = body.matchId;
  } catch {
    /* clear */
  }

  const supabase = await getServerSupabase();
  await supabase.from("profiles").update({ pinned_match: matchId }).eq("id", user.id);
  return NextResponse.json({ pinnedMatch: matchId });
}
