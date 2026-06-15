import type { Metadata } from "next";
import { F1Board } from "@/components/f1/F1Board";
import { f1Adapter } from "@/lib/sports/f1";

export const metadata: Metadata = {
  title: "F1 2026 — Live Season Board",
  description:
    "Every round of the 2026 Formula 1 calendar — live podiums, drivers' championship and start times.",
};

export default function F1Page() {
  return <F1Board initial={f1Adapter.snapshot()} />;
}
