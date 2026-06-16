// Favorites are namespaced per sport so codes can't collide across leagues
// (e.g. soccer "USA" vs a hypothetical NBA "USA").
export function favKey(sport: string, code: string): string {
  return `${sport}:${code}`;
}
