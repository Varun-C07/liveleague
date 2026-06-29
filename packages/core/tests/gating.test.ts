import { describe, it, expect } from "vitest";
import {
  entitlementsForSku,
  entitlementsFromSubs,
  canSubmitPrediction,
  canViewPro,
  showAds,
} from "../src/gating";

describe("entitlementsForSku", () => {
  it("personal grants only personal", () => {
    expect(entitlementsForSku("personal")).toEqual({ hasPersonal: true, hasPro: false });
  });
  it("pro grants only pro", () => {
    expect(entitlementsForSku("pro")).toEqual({ hasPersonal: false, hasPro: true });
  });
  it("combo grants both", () => {
    expect(entitlementsForSku("combo")).toEqual({ hasPersonal: true, hasPro: true });
  });
});

describe("entitlementsFromSubs", () => {
  it("no subs => nothing", () => {
    expect(entitlementsFromSubs([])).toEqual({ hasPersonal: false, hasPro: false });
  });
  it("ignores canceled/past_due", () => {
    expect(
      entitlementsFromSubs([
        { sku: "personal", status: "canceled" },
        { sku: "pro", status: "past_due" },
      ]),
    ).toEqual({ hasPersonal: false, hasPro: false });
  });
  it("active personal + active pro => both", () => {
    expect(
      entitlementsFromSubs([
        { sku: "personal", status: "active" },
        { sku: "pro", status: "trialing" },
      ]),
    ).toEqual({ hasPersonal: true, hasPro: true });
  });
  it("active combo => both", () => {
    expect(entitlementsFromSubs([{ sku: "combo", status: "active" }])).toEqual({
      hasPersonal: true,
      hasPro: true,
    });
  });
  it("is idempotent over duplicates", () => {
    const subs = [
      { sku: "personal" as const, status: "active" },
      { sku: "personal" as const, status: "active" },
    ];
    expect(entitlementsFromSubs(subs)).toEqual(entitlementsFromSubs(subs));
  });
});

describe("feature predicates", () => {
  it("prediction needs personal; pro pages need pro; ads hidden for pro", () => {
    const free = { hasPersonal: false, hasPro: false };
    const personal = { hasPersonal: true, hasPro: false };
    const pro = { hasPersonal: false, hasPro: true };
    expect(canSubmitPrediction(personal)).toBe(true);
    expect(canSubmitPrediction(free)).toBe(false);
    expect(canViewPro(pro)).toBe(true);
    expect(canViewPro(free)).toBe(false);
    expect(showAds(free)).toBe(true);
    expect(showAds(pro)).toBe(false);
  });
});
