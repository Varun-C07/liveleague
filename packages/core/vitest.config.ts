import { defineConfig } from "vitest/config";

// Pure-logic unit tests for the shared core package. Tests import the subjects
// via relative paths ("../src/..."), so no path alias is needed.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
