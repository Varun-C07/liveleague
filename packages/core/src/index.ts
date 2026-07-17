// @liveleagues/core — shared pure-TS logic used by both the web app and the
// future Expo mobile app. No DOM, no Node-only, no server adapters: portable.
//
// Granular subpath imports are also available (see package.json "exports"),
// e.g. `import { winProb } from "@liveleagues/core/win-prob"`.
//
// NOTE: the DTO/domain-type modules are intentionally NOT re-exported here —
// they share names with the multi-sport ./sports/types (StandingRow,
// DataSource). Import them from their subpaths instead:
//   import type { Match } from "@liveleagues/core/types";       // soccer domain
//   import type { ApiMatch } from "@liveleagues/core/api-shape"; // API DTOs

export * from "./win-prob";
export * from "./scoring";
export * from "./polling";
export * from "./gating";
export * from "./favorites";
export * from "./group-scenarios";
export * from "./joincode";

export * from "./sports/types";
export * from "./sports/meta";
export * from "./sports/format";
export * from "./sports/f1-scenarios";
export * from "./sports/agenda-window";
