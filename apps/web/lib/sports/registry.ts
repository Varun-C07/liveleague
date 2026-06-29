import type { SportAdapter } from "@liveleague/core/sports/types";
import { f1Adapter } from "./f1";
import { soccerAdapter } from "./soccer";
import { nbaAdapter } from "./nba";
import { cricketAdapter } from "./cricket";
import { baseballAdapter } from "./baseball";

// Registry of every sport. Display order on the home page follows this array.
export const SPORTS: SportAdapter[] = [
  f1Adapter,
  soccerAdapter,
  nbaAdapter,
  cricketAdapter,
  baseballAdapter,
];

export function getAdapter(id: string): SportAdapter | undefined {
  return SPORTS.find((s) => s.id === id);
}
