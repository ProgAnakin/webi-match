// Shared types for the /consulente training zone.

export type GuideLang = "it" | "en";

export interface ProductGuide {
  product_id: string;
  product_name: string;
  description_it: string;
  specs_it: string;
  tips_it: string;
  description_en: string;
  specs_en: string;
  tips_en: string;
  updated_at: string;
}

// Resolves the three guide fields for the chosen language, falling back to
// Italian when an English field was left blank by the manager.
export function localisedGuide(g: ProductGuide, lang: GuideLang) {
  if (lang === "en") {
    return {
      description: g.description_en.trim() || g.description_it,
      specs:       g.specs_en.trim()       || g.specs_it,
      tips:        g.tips_en.trim()        || g.tips_it,
    };
  }
  return { description: g.description_it, specs: g.specs_it, tips: g.tips_it };
}
