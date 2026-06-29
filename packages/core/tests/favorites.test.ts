import { describe, it, expect } from "vitest";
import { favKey, splitFavKey } from "../src/favorites";

describe("favKey", () => {
  it("namespaces a code by sport", () => {
    expect(favKey("soccer", "USA")).toBe("soccer:USA");
    expect(favKey("nba", "LAL")).toBe("nba:LAL");
  });
  it("keeps sports from colliding on the same code", () => {
    expect(favKey("soccer", "USA")).not.toBe(favKey("nba", "USA"));
  });
});

describe("splitFavKey", () => {
  it("round-trips with favKey", () => {
    expect(splitFavKey(favKey("soccer", "USA"))).toEqual({ sport: "soccer", code: "USA" });
    expect(splitFavKey(favKey("f1", "VER"))).toEqual({ sport: "f1", code: "VER" });
  });
  it("rejects malformed keys", () => {
    expect(splitFavKey("nocolon")).toBeNull();
    expect(splitFavKey(":USA")).toBeNull();
    expect(splitFavKey("soccer:")).toBeNull();
    expect(splitFavKey("")).toBeNull();
  });
});
