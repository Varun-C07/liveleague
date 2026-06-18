// Favorites are namespaced per sport so codes can't collide across leagues
// (e.g. soccer "USA" vs a hypothetical NBA "USA").
export function favKey(sport: string, code: string): string {
  return `${sport}:${code}`;
}

// Parse a favKey back into its parts. Returns null for malformed keys.
export function splitFavKey(key: string): { sport: string; code: string } | null {
  const i = key.indexOf(":");
  if (i <= 0 || i === key.length - 1) return null;
  return { sport: key.slice(0, i), code: key.slice(i + 1) };
}
