import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Save, Check, ChevronLeft, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { products as coreProducts } from "@/data/products";
import { toast } from "sonner";

// Manager-side editor for the /consulente training guides. The manager writes
// every field by hand — there is no AI generation. One row per product in the
// product_guides table; Italian is primary, English is optional.

interface GuideForm {
  description_it: string;
  specs_it: string;
  tips_it: string;
  description_en: string;
  specs_en: string;
  tips_en: string;
}

interface ProductRef {
  id: string;
  name: string;
  source: "core" | "custom";
}

const EMPTY_FORM: GuideForm = {
  description_it: "", specs_it: "", tips_it: "",
  description_en: "", specs_en: "", tips_en: "",
};

const FIELD_GROUPS: { lang: "it" | "en"; flag: string; label: string }[] = [
  { lang: "it", flag: "🇮🇹", label: "Italiano (primary)" },
  { lang: "en", flag: "🇬🇧", label: "English (optional)" },
];

const FIELDS: { key: "description" | "specs" | "tips"; label: string; hint: string }[] = [
  { key: "description", label: "Description", hint: "A medium-length explanation of the product." },
  { key: "specs",       label: "Specs & characteristics", hint: "Technical data sheet — one point per line." },
  { key: "tips",        label: "Selling tips", hint: "Strong points and arguments to close the sale." },
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
      .select("description_it, specs_it, tips_it, description_en, specs_en, tips_en")
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
          FIELD_GROUPS.map((group) => (
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
          ))
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
