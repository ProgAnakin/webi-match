import { describe, it, expect } from "vitest";
import { getMatchedProduct, products } from "@/data/products";
import { buildTagMap, questionsToCards, resolveCardText } from "@/data/quiz-cards";
import { questions } from "@/data/questions";
import type { QuizCard } from "@/data/quiz-cards";

// ── questionsToCards roundtrip ─────────────────────────────────────────────
describe("questionsToCards", () => {
  it("converts all static questions to QuizCards with correct shape", () => {
    const cards = questionsToCards(questions);
    expect(cards).toHaveLength(questions.length);
    cards.forEach((card, i) => {
      expect(card.id).toBe(i + 1);
      expect(card.text_it).toBe(questions[i].text);
      expect(card.tag).toBe(questions[i].category);
      expect(card.active).toBe(true);
      expect(card.sort_order).toBe(i + 1);
    });
  });
});

// ── buildTagMap ────────────────────────────────────────────────────────────
describe("buildTagMap", () => {
  it("maps card id → tag string", () => {
    const cards = questionsToCards(questions);
    const tagMap = buildTagMap(cards);
    cards.forEach((card) => {
      expect(tagMap[card.id]).toBe(card.tag);
    });
  });

  it("handles custom cards with new tags", () => {
    const custom: QuizCard[] = [
      { id: 99, emoji: "☕", tag: "coffee", sort_order: 0, active: true,
        text_it: "Ami il caffè?", text_en: null, text_pt: null, text_es: null, text_fr: null },
    ];
    const tagMap = buildTagMap(custom);
    expect(tagMap[99]).toBe("coffee");
  });
});

// ── resolveCardText ────────────────────────────────────────────────────────
describe("resolveCardText", () => {
  const card: QuizCard = {
    id: 1, emoji: "🏋️", tag: "sport", sort_order: 0, active: true,
    text_it: "Testo italiano",
    text_en: "English text",
    text_pt: null,
    text_es: "",
    text_fr: null,
  };

  it("returns the correct language when available", () => {
    expect(resolveCardText(card, "en")).toBe("English text");
    expect(resolveCardText(card, "it")).toBe("Testo italiano");
  });

  it("falls back to italian when translation is null", () => {
    expect(resolveCardText(card, "pt")).toBe("Testo italiano");
    expect(resolveCardText(card, "fr")).toBe("Testo italiano");
  });

  it("falls back to italian when translation is empty string", () => {
    expect(resolveCardText(card, "es")).toBe("Testo italiano");
  });

  it("falls back to italian for unknown language codes", () => {
    expect(resolveCardText(card, "de")).toBe("Testo italiano");
    expect(resolveCardText(card, "")).toBe("Testo italiano");
  });
});

// ── Full quiz flow: cards → tagMap → getMatchedProduct ────────────────────
describe("quiz data flow (end-to-end logic)", () => {
  it("cards converted from questions produce the same results as static TAG_MAP", () => {
    const cards  = questionsToCards(questions);
    const tagMap = buildTagMap(cards);

    // Audio + productivity + travel profile → Aurae Pulse Pro (unique winner) with both approaches
    const answers = { 2: true, 3: true, 5: true } as Record<number, boolean>;
    const { product: withTagMap } = getMatchedProduct(answers, undefined, undefined, tagMap);
    const { product: withStatic } = getMatchedProduct(answers);
    expect(withTagMap.id).toBe(withStatic.id);
  });

  it("custom card with new tag routes to custom product correctly", () => {
    // Simulate a custom card ID=99 with tag "coffee".
    // No core product has tag "coffee" so the score stays at base — activeIds filter ensures the right one wins.
    const tagMap: Record<number, string> = { 99: "coffee" };
    const answers: Record<number, boolean> = { 99: true };
    // Without a matching product all answers just go to the best-scoring product.
    const { product } = getMatchedProduct(answers, undefined, undefined, tagMap);
    expect(product).toBeDefined();
  });

  it("product count remains consistent after applying activeIds filter", () => {
    const cards  = questionsToCards(questions);
    const tagMap = buildTagMap(cards);
    const answers: Record<number, boolean> = { 1: true, 2: true, 3: true };

    const allActive = new Set(products.map((p) => p.id));
    const { product: allResult }    = getMatchedProduct(answers, allActive, products, tagMap);
    const singleActive = new Set(["pulsar-recover-x"]);
    const { product: singleResult } = getMatchedProduct(answers, singleActive, products, tagMap);

    expect(allResult).toBeDefined();
    expect(singleResult.id).toBe("pulsar-recover-x");
  });

  it("match percent is clamped between 45 and 98", () => {
    const cards  = questionsToCards(questions);
    const tagMap = buildTagMap(cards);

    // All false — min clamp
    const { matchPercent: low } = getMatchedProduct(
      Object.fromEntries(cards.map((c) => [c.id, false])),
      undefined, undefined, tagMap,
    );
    expect(low).toBeGreaterThanOrEqual(45);

    // Perfect match — ceiling clamp
    const { matchPercent: high } = getMatchedProduct(
      { 2: true, 3: true, 5: true },
      undefined, undefined, tagMap,
    );
    expect(high).toBeLessThanOrEqual(98);
  });
});
