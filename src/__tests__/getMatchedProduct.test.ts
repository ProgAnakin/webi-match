import { describe, it, expect } from "vitest";
import { getMatchedProduct, products } from "@/data/products";

describe("getMatchedProduct", () => {
  it("returns a product and a percent within [45, 98]", () => {
    const { product, matchPercent } = getMatchedProduct({ 1: true, 2: false });
    expect(product).toBeDefined();
    expect(matchPercent).toBeGreaterThanOrEqual(45);
    expect(matchPercent).toBeLessThanOrEqual(98);
  });

  it("is deterministic — same answers always return the same product", () => {
    const answers = { 1: true, 3: true, 5: true };
    const a = getMatchedProduct(answers);
    const b = getMatchedProduct(answers);
    expect(a.product.id).toBe(b.product.id);
    expect(a.matchPercent).toBe(b.matchPercent);
  });

  it("respects activeIds filter", () => {
    const activeIds = new Set(["outin-nano"]);
    const { product } = getMatchedProduct({ 5: true, 3: true, 4: true }, activeIds);
    expect(product.id).toBe("outin-nano");
  });

  it("falls back to full catalogue when activeIds is empty", () => {
    const { product } = getMatchedProduct({ 1: true }, new Set());
    expect(products.some((p) => p.id === product.id)).toBe(true);
  });

  it("scores sport+wellness+travel answers toward BLND Blender", () => {
    // Q1=sport, Q4=wellness, Q5=travel — winning profile for blnd-blender
    const { product } = getMatchedProduct({ 1: true, 4: true, 5: true });
    expect(product.id).toBe("blnd-blender");
  });

  it("scores audio+productivity+style toward Veho ZB-7", () => {
    // Q2=audio, Q3=productivity, Q7=style — winning profile for veho-zb7
    const { product } = getMatchedProduct({ 2: true, 3: true, 7: true });
    expect(product.id).toBe("veho-zb7");
  });

  it("returns percent 45 when no tags match (floor clamping)", () => {
    // All false answers → 0 tag matches → clamped to MATCH_MIN = 45
    const { matchPercent } = getMatchedProduct({ 1: false, 2: false });
    expect(matchPercent).toBe(45);
  });

  it("never exceeds 98 (ceiling clamping)", () => {
    // Perfect 3/3 tag match → raw 100% → clamped to 98
    const { matchPercent } = getMatchedProduct({ 1: true, 4: true, 5: true });
    expect(matchPercent).toBeLessThanOrEqual(98);
  });
});
