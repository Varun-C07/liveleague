import { Home } from "@/components/design/screens/Home";
import { liveOverview } from "@/lib/sports/overview";

export const dynamic = "force-dynamic";

// Server-seed the cross-sport overview cache-first (instant, latest stored data)
// so first paint is current; React Query then keeps polling /api/live.
export default async function Page() {
  return <Home initial={await liveOverview()} />;
}
