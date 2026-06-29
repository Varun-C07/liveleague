import { getAdminSupabase } from "@/lib/db/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Locks predictions whose kickoff has passed. Scheduled every minute by Supabase
// pg_cron (Authorization: Bearer CRON_SECRET).
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  return !!secret && req.headers.get("authorization") === `Bearer ${secret}`;
}

async function run(req: Request) {
  if (!authorized(req)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const admin = getAdminSupabase();
  const { data } = await admin
    .from("predictions")
    .update({ locked: true, updated_at: new Date().toISOString() })
    .eq("locked", false)
    .lte("kickoff_utc", new Date().toISOString())
    .select("id");
  return Response.json({ locked: data?.length ?? 0 });
}

export const POST = run;
export const GET = run;
