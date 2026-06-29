import { describe, it, expect } from "vitest";
import {
  makeJoinCode,
  isValidJoinCode,
  normalizeJoinCode,
  genJoinCode,
  JOINCODE_ALPHABET,
  JOINCODE_LENGTH,
} from "../src/joincode";

describe("join codes", () => {
  it("makeJoinCode produces a length-6 code from the alphabet", () => {
    const code = makeJoinCode(() => 0); // always first char
    expect(code).toBe("AAAAAA");
    expect(code).toHaveLength(JOINCODE_LENGTH);
  });

  it("alphabet excludes ambiguous chars", () => {
    for (const bad of ["O", "0", "I", "1", "L"]) {
      expect(JOINCODE_ALPHABET).not.toContain(bad);
    }
  });

  it("isValidJoinCode accepts valid, rejects invalid", () => {
    expect(isValidJoinCode("K7QF9P")).toBe(true);
    expect(isValidJoinCode("ABC")).toBe(false); // too short
    expect(isValidJoinCode("ABCDE0")).toBe(false); // contains 0
    expect(isValidJoinCode("abcdef")).toBe(false); // lowercase
  });

  it("normalizeJoinCode uppercases and strips spaces", () => {
    expect(normalizeJoinCode("  k7q f9p ")).toBe("K7QF9P");
  });

  it("genJoinCode produces a valid code", () => {
    const code = genJoinCode();
    expect(isValidJoinCode(code)).toBe(true);
  });
});
