// Moved into @liveleagues/core so the Expo mobile app shares the exact same
// soccer fixtures/standings hooks. This shim keeps existing web imports
// (`@/hooks/useMatches`) working unchanged.
export * from "@liveleagues/core/hooks/useMatches";
