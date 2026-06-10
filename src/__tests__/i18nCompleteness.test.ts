import { describe, expect, it } from "vitest";
import { LANGUAGES, translations, type Lang } from "@/i18n/translations";

// The TypeScript Record<Lang, T> already guarantees structural parity between
// the five languages — what it CANNOT catch is an empty string, a forgotten
// "" placeholder, or an interpolation function that returns garbage. This
// suite walks every leaf of every language and asserts real content.

const LANGS = Object.keys(translations) as Lang[];

/** Sample args for function leaves, keyed by nothing — every i18n function in T
 *  takes numbers or an optional name string; calling with these must produce
 *  meaningful text. */
const FN_ARGS: unknown[][] = [[3, 8], ["Anna"], [24], [""]];

/** Calls a function leaf with each sample arg list until one returns a string. */
function callLeaf(fn: (...args: never[]) => unknown): string | null {
  for (const args of FN_ARGS) {
    try {
      const out = fn(...(args as never[]));
      if (typeof out === "string") return out;
    } catch {
      /* try the next signature */
    }
  }
  return null;
}

function collectLeaves(node: unknown, path: string, out: { path: string; value: string }[]) {
  if (typeof node === "string") {
    out.push({ path, value: node });
    return;
  }
  if (typeof node === "function") {
    const rendered = callLeaf(node as (...args: never[]) => unknown);
    out.push({ path: `${path}()`, value: rendered ?? "" });
    return;
  }
  if (node && typeof node === "object") {
    for (const [key, child] of Object.entries(node)) {
      collectLeaves(child, path ? `${path}.${key}` : key, out);
    }
  }
}

describe("i18n completeness", () => {
  it("LANGUAGES selector lists every supported language exactly once", () => {
    const codes = LANGUAGES.map((l) => l.code);
    expect([...codes].sort()).toEqual([...LANGS].sort());
    expect(new Set(codes).size).toBe(codes.length);
    for (const l of LANGUAGES) {
      expect(l.flag.length).toBeGreaterThan(0);
      expect(l.label.trim().length).toBeGreaterThan(0);
      expect(l.name.trim().length).toBeGreaterThan(0);
    }
  });

  it.each(LANGS)("every leaf in '%s' has non-empty content", (lang) => {
    const leaves: { path: string; value: string }[] = [];
    collectLeaves(translations[lang], "", leaves);
    expect(leaves.length).toBeGreaterThan(100); // sanity: the tree was actually walked

    const empty = leaves.filter((l) => l.value.trim().length === 0);
    expect(empty, `empty leaves in '${lang}': ${empty.map((l) => l.path).join(", ")}`).toEqual([]);
  });

  it.each(LANGS)("'%s' has all 8 quiz question fallbacks", (lang) => {
    const qs = translations[lang].questions;
    for (let i = 1; i <= 8; i++) {
      expect(qs[i as keyof typeof qs]?.trim().length, `question ${i} in '${lang}'`).toBeGreaterThan(0);
    }
  });

  it("interpolation functions embed their arguments", () => {
    for (const lang of LANGS) {
      const t = translations[lang];
      expect(t.quiz.questionOf(3, 8)).toMatch(/3.*8/);
      expect(t.welcome.cooldownError(24)).toContain("24");
      expect(t.changeEmail.tooManyAttempts(30)).toContain("30");
      expect(t.success.title("Anna")).toContain("Anna");
    }
  });
});
