import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Save, Check, ChevronLeft, BookOpen, Paperclip } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { products as coreProducts } from "@/data/products";
import { toast } from "sonner";

// Manager-side editor for the /consulente training guides. The manager writes
// every field by hand — there is no AI generation. One row per product in the
// product_guides table; Italian is primary, English is optional.

interface GuideForm {
  description_it: string;    description_en: string;
  insight_1_it: string;      insight_1_en: string;
  insight_2_it: string;      insight_2_en: string;
  manager_advice_it: string; manager_advice_en: string;
}

interface ProductRef {
  id: string;
  name: string;
  source: "core" | "custom";
}

const EMPTY_FORM: GuideForm = {
  description_it: "",    description_en: "",
  insight_1_it: "",      insight_1_en: "",
  insight_2_it: "",      insight_2_en: "",
  manager_advice_it: "", manager_advice_en: "",
};

const GUIDE_COLUMNS =
  "description_it, description_en, insight_1_it, insight_1_en, insight_2_it, insight_2_en, manager_advice_it, manager_advice_en";

const FIELD_GROUPS: { lang: "it" | "en"; flag: string; label: string }[] = [
  { lang: "it", flag: "🇮🇹", label: "Italiano (primary)" },
  { lang: "en", flag: "🇬🇧", label: "English (optional)" },
];

type FieldKey = "description" | "insight_1" | "insight_2" | "manager_advice";

const FIELDS: { key: FieldKey; label: string; hint: string }[] = [
  { key: "description",    label: "Product description",  hint: "What the product is — a clear, medium-length explanation." },
  { key: "insight_1",      label: "Consultant insight 1", hint: "A selling angle or fact the consultant should know." },
  { key: "insight_2",      label: "Consultant insight 2", hint: "A second selling angle or fact." },
  { key: "manager_advice", label: "Manager's advice",     hint: "Your personal advice on how to sell this product." },
];

export function GuideEditorTab() {
  const [customNames, setCustomNames] = useState<ProductRef[]>([]);
  const [guidedIds, setGuidedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const [selected, setSelected] = useState<ProductRef | null>(null);
  const [form, setForm] = useState<GuideForm>(EMPTY_FORM);
  const [loadingGuide, setLoadingGuide] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [customRes, guidesRes] = await Promise.all([
      supabase.from("custom_products").select("id, name").eq("status", "active"),
      supabase.from("product_guides").select("product_id"),
    ]);
    setCustomNames(
      (customRes.data ?? []).map((r) => ({ id: r.id, name: r.name, source: "custom" as const })),
    );
    setGuidedIds(new Set((guidesRes.data ?? []).map((r) => r.product_id)));
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Core products (hardcoded) + active custom products (DB), de-duplicated by id.
  const allProducts = useMemo<ProductRef[]>(() => {
    const core: ProductRef[] = coreProducts.map((p) => ({ id: p.id, name: p.name, source: "core" }));
    const seen = new Set(core.map((p) => p.id));
    const merged = [...core];
    for (const c of customNames) if (!seen.has(c.id)) merged.push(c);
    return merged.sort((a, b) => a.name.localeCompare(b.name));
  }, [customNames]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? allProducts.filter((p) => p.name.toLowerCase().includes(q)) : allProducts;
  }, [allProducts, query]);

  const openEditor = async (p: ProductRef) => {
    setSelected(p);
    setSaved(false);
    setLoadingGuide(true);
    const { data } = await supabase
      .from("product_guides")
      .select(GUIDE_COLUMNS)
      .eq("product_id", p.id)
      .maybeSingle();
    setForm(data ? { ...EMPTY_FORM, ...data } : EMPTY_FORM);
    setLoadingGuide(false);
  };

  const saveGuide = async () => {
    if (!selected) return;
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("product_guides").upsert({
      product_id: selected.id,
      product_name: selected.name,
      ...form,
      updated_at: new Date().toISOString(),
      updated_by: userData.user?.id ?? null,
    });
    setSaving(false);
    if (error) {
      toast.error("Error saving guide.");
      return;
    }
    setGuidedIds((prev) => new Set(prev).add(selected.id));
    setSaved(true);
    toast.success("Guide saved.");
    setTimeout(() => setSaved(false), 2500);
  };

  // ─── Editor view ───────────────────────────────────────────────────────────
  if (selected) {
    return (
      <div className="space-y-5">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Back to products
        </button>

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-foreground">{selected.name}</h2>
            <p className="text-xs text-muted-foreground">
              This guide is what consultants see at <code className="text-primary">/consulente</code>.
            </p>
          </div>
          <button
            onClick={saveGuide}
            disabled={saving || loadingGuide}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground active:scale-95 disabled:opacity-60"
          >
            {saved ? <><Check className="h-3 w-3" /> Saved!</> : <><Save className="h-3 w-3" /> {saving ? "Saving…" : "Save"}</>}
          </button>
        </div>

        {loadingGuide ? (
          <div className="py-12 text-center text-xs text-muted-foreground">Loading guide…</div>
        ) : (
          <>
            {FIELD_GROUPS.map((group) => (
              <div key={group.lang} className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {group.flag} {group.label}
                </p>
                {FIELDS.map((field) => {
                  const formKey = `${field.key}_${group.lang}` as keyof GuideForm;
                  return (
                    <div key={formKey} className="rounded-xl border border-border bg-card p-4 space-y-2">
                      <label className="block text-xs font-semibold text-foreground">{field.label}</label>
                      <p className="text-[10px] text-muted-foreground">{field.hint}</p>
                      <textarea
                        value={form[formKey]}
                        onChange={(e) => setForm((f) => ({ ...f, [formKey]: e.target.value }))}
                        rows={4}
                        className="w-full resize-y rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Files & manuals — STANDBY (table exists, upload UI not built yet) */}
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4">
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-semibold text-muted-foreground">Files &amp; manuals</p>
                <span className="ml-auto rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                  Coming soon
                </span>
              </div>
              <p className="mt-1.5 text-[10px] text-muted-foreground/70">
                Uploading spec sheets / manuals for consultants to download will be enabled in a later release.
              </p>
            </div>
          </>
        )}
      </div>
    );
  }

  // ─── Product picker ────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Consultant Guide</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Write the training sheet for each product. Consultants read it (read-only) at /consulente.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a product…"
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-muted-foreground">Loading products…</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => {
            const hasGuide = guidedIds.has(p.id);
            return (
              <button
                key={p.id}
                onClick={() => openEditor(p)}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:border-primary/40 active:scale-[0.99]"
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  hasGuide ? "bg-green-500/15 text-green-400" : "bg-muted/40 text-muted-foreground"
                }`}>
                  <BookOpen className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {hasGuide ? "Guide published" : "No guide yet"}
                  </p>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="py-8 text-center text-xs text-muted-foreground">No product matches "{query}".</p>
          )}
        </div>
      )}
    </div>
  );
}
