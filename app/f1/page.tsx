import type { Metadata } from "next";
import { F1 } from "@/components/design/screens/F1";
import { f1Adapter } from "@/lib/sports/f1";

export const metadata: Metadata = {
  title: "F1 2026 — Live Season Board",
  description:
    "Every round of the 2026 Formula 1 calendar — live podiums, drivers' championship and start times.",
};

export const dynamic = "force-dynamic";

// Cache-first SSR seed: the latest stored bundle (with standings) renders
// instantly, so the board never flashes the "feed unreachable" empty state.
export default async function F1Page() {
  return <F1 initial={await f1Adapter.getLive(true)} />;
}
