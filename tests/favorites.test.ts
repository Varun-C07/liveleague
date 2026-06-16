import { describe, it, expect } from "vitest";
import { favKey } from "@/lib/favorites";

describe("favKey", () => {
  it("namespaces a code by sport", () => {
    expect(favKey("soccer", "USA")).toBe("soccer:USA");
    expect(favKey("nba", "LAL")).toBe("nba:LAL");
  });
  it("keeps sports from colliding on the same code", () => {
    expect(favKey("soccer", "USA")).not.toBe(favKey("nba", "USA"));
  });
});
