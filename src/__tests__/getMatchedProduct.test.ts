import { describe, it, expect } from "vitest";
import { getMatchedProduct, products } from "@/data/products";

describe("getMatchedProduct", () => {
  it("returns a product and a percent within [45, 98]", () => {
    const { product, matchPercent } = getMatchedProduct({ 1: true, 2: false });
    expect(product).toBeDefined();
    expect(matchPercent).toBeGreaterThanOrEqual(45);
    expect(matchPercent).toBeLessThanOrEqual(98);
  });

  it("picks randomly among tied top-scoring products", () => {
    // Q1=sport, Q3=productivity, Q5=travel — four products tie at score 2
    const answers = { 1: true, 3: true, 5: true };
    const tiedIds = new Set([
      "blnd-blender",
      "head-hdtw01",
      "outin-nano",
      "veho-pebble-mg5",
    ]);
    const seen = new Set<string>();
    for (let i = 0; i < 80; i++) {
      const { product } = getMatchedProduct(answers);
      expect(tiedIds.has(product.id)).toBe(true);
      seen.add(product.id);
    }
    // Over 80 runs the random pick should surface more than one product.
    expect(seen.size).toBeGreaterThan(1);
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
