import { NextResponse } from "next/server";
import { agendaData } from "@/lib/sports/agenda";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await agendaData();
  const live = data.games.some((g) => g.status === "live");
  const sMaxAge = live ? 15 : 60;
  return NextResponse.json(data, {
    headers: { "Cache-Control": `public, s-maxage=${sMaxAge}, stale-while-revalidate=120` },
  });
}
