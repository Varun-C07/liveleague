import { NextResponse } from "next/server";
import { getServerSupabase, getSessionUser } from "@/lib/db/supabase-server";

export const dynamic = "force-dynamic";

// GET: the signed-in user's recent notifications + unread count. RLS scopes
// every row to auth.uid(), so no explicit user filter is required.
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ notifications: [], unread: 0 });

  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from("notifications")
    .select("id, type, sport, match_id, title, body, payload, created_at, read_at")
    .order("created_at", { ascending: false })
    .limit(30);

  const notifications = data ?? [];
  const unread = notifications.filter((n) => n.read_at == null).length;
  return NextResponse.json({ notifications, unread });
}

// PATCH: mark notifications read. Body { ids?: string[] } marks those ids;
// omit ids to mark all of the user's unread as read.
export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  let ids: string[] | undefined;
  try {
    const body = await req.json();
    if (Array.isArray(body?.ids)) ids = body.ids.filter((x: unknown) => typeof x === "string");
  } catch {
    /* no body => mark all */
  }

  const supabase = await getServerSupabase();
  let q = supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);
  if (ids && ids.length > 0) q = q.in("id", ids);
  const { data } = await q.select("id");

  return NextResponse.json({ marked: data?.length ?? 0 });
}
