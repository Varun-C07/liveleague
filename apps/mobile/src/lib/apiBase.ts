// The @liveleagues/core data hooks call relative "/api/*" (resolves to the web
// origin in the browser). On a device there is no origin, so we prefix relative
// /api requests with the configured base. Set EXPO_PUBLIC_API_URL to override
// (e.g. http://<your-LAN-ip>:3000 for a local web server); defaults to prod.
const API_BASE = (process.env.EXPO_PUBLIC_API_URL ?? "https://live-league.vercel.app").replace(/\/+$/, "");

export function installApiBase(): void {
  const g = globalThis as unknown as { __llFetchPatched?: boolean; fetch: typeof fetch };
  if (g.__llFetchPatched) return;
  g.__llFetchPatched = true;
  const orig = g.fetch;
  g.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === "string" && input.startsWith("/")) {
      return orig(API_BASE + input, init);
    }
    if (input instanceof Request && input.url.startsWith("/")) {
      return orig(new Request(API_BASE + input.url, input), init);
    }
    return orig(input, init);
  }) as typeof fetch;
}

export { API_BASE };
