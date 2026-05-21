// Shared types for the /consulente training zone.

export type GuideLang = "it" | "en";

export interface ProductGuide {
  product_id: string;
  product_name: string;
  description_it: string;
  description_en: string;
  insight_1_it: string;
  insight_1_en: string;
  insight_2_it: string;
  insight_2_en: string;
  manager_advice_it: string;
  manager_advice_en: string;
  manager_advice_audio_url: string | null;
  video_url: string;
  updated_at: string;
}

// Resolves every guide field for the chosen language, falling back to the
// Italian value when the English field was left blank by the manager.
export function localisedGuide(g: ProductGuide, lang: GuideLang) {
  const pick = (it: string, en: string) =>
    lang === "en" ? (en.trim() || it) : it;
  return {
    description:   pick(g.description_it,    g.description_en),
    insight1:      pick(g.insight_1_it,      g.insight_1_en),
    insight2:      pick(g.insight_2_it,      g.insight_2_en),
    managerAdvice: pick(g.manager_advice_it, g.manager_advice_en),
  };
}
