import { defineConfig } from "vitest/config";
import path from "node:path";

// Unit tests for pure logic (adapters' normalization, scenario math, helpers).
// The `@/` alias mirrors tsconfig so test imports match app imports.
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname) } },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
