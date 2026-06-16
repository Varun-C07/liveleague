import type { Metadata } from "next";
import { AgendaBoard } from "@/components/agenda/AgendaBoard";
import { snapshotAgenda } from "@/lib/sports/agenda";

export const metadata: Metadata = {
  title: "My Agenda — Today, This Week, This Month",
  description: "Every match across F1, soccer, NBA, cricket and MLB on one agenda.",
};

export default function AgendaPage() {
  return <AgendaBoard initial={snapshotAgenda()} />;
}
