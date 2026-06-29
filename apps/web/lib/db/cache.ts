import "server-only";

import { getAdminSupabase } from "@/lib/db/supabase-admin";

// Write-through cache for scraped live data (data_cache table). Best-effort and
// fully optional: every helper swallows errors and no-ops when Supabase isn't
// configured, so the data path works identically with or without a database.

function configured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export type CachedEntry<T> = { payload: T; source: string; syncedAt: string };

// Persist the latest successfully-normalized payload for a sport.
export async function writeCache(sport: string, payload: unknown, source = "live"): Promise<void> {
  if (!configured()) return;
  try {
    await getAdminSupabase()
      .from("data_cache")
      .upsert(
        { sport, payload, source, synced_at: new Date().toISOString() },
        { onConflict: "sport" },
      );
  } catch {
    /* cache is best-effort — never break the request on a write failure */
  }
}

// Read the last cached payload for a sport (used when upstream is unreachable).
export async function readCache<T>(sport: string): Promise<CachedEntry<T> | null> {
  if (!configured()) return null;
  try {
    const { data } = await getAdminSupabase()
      .from("data_cache")
      .select("payload, source, synced_at")
      .eq("sport", sport)
      .maybeSingle();
    if (!data) return null;
    return { payload: data.payload as T, source: data.source as string, syncedAt: data.synced_at as string };
  } catch {
    return null;
  }
}
