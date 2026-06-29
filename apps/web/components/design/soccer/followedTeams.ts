"use client";

// Followed teams power the bundle's "follow up to 4 teams" feature and the
// "My teams" fixtures filter. This is a PAID, per-user capability — not built.
//
// BACKEND SEAM: replace with real followed-teams from Supabase (max 4 per user).
// Return their FIFA codes (e.g. ["BRA","ESP"]). UI reads ONLY this hook; when it
// returns empty, the "My teams" view shows the bundle tease.
const NONE: readonly string[] = [];

export function useFollowedTeams(): readonly string[] {
  return NONE;
}
