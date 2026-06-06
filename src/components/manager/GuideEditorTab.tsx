import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Save, Check, ChevronLeft, BookOpen, Paperclip, Trash2 } from "lucide-react";
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
  // Single YouTube link — not language-specific.
  video_url: string;
}

interface ProductRef {
  id: string;
  name: string;
  // "orphan" = a guide exists but its product is no longer in the catalog.
  source: "core" | "custom" | "orphan";
}

const EMPTY_FORM: GuideForm = {
  description_it: "",    description_en: "",
  insight_1_it: "",      insight_1_en: "",
  insight_2_it: "",      insight_2_en: "",
  manager_advice_it: "", manager_advice_en: "",
  video_url: "",
};

const GUIDE_COLUMNS =
  "description_it, description_en, insight_1_it, insight_1_en, insight_2_it, insight_2_en, manager_advice_it, manager_advice_en, video_url";

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
  // product_id → product_name for every product that already has a guide row.
  const [guideNames, setGuideNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const [selected, setSelected] = useState<ProductRef | null>(null);
  const [form, setForm] = useState<GuideForm>(EMPTY_FORM);
  const [loadingGuide, setLoadingGuide] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [customRes, guidesRes] = await Promise.all([
      supabase.from("custom_products").select("id, name").eq("status", "active"),
      supabase.from("product_guides").select("product_id, product_name"),
    ]);
    setCustomNames(
      (customRes.data ?? []).map((r) => ({ id: r.id, name: r.name, source: "custom" as const })),
    );
    const gNames: Record<string, string> = {};
    for (const r of (guidesRes.data ?? []) as { product_id: string; product_name: string }[]) {
      gNames[r.product_id] = r.product_name;
    }
    setGuideNames(gNames);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Core products (hardcoded) + active custom products (DB) + orphan guides,
  // de-duplicated by id.
  const allProducts = useMemo<ProductRef[]>(() => {
    const merged: ProductRef[] = coreProducts.map((p) => ({ id: p.id, name: p.name, source: "core" }));
    const seen = new Set(merged.map((p) => p.id));
    for (const c of customNames) {
      if (!seen.has(c.id)) { merged.push(c); seen.add(c.id); }
    }
    // Orphan guides — the guide outlived its product (deleted custom product).
    // Surfaced so the manager can still open and delete them.
    for (const [pid, pname] of Object.entries(guideNames)) {
      if (!seen.has(pid)) { merged.push({ id: pid, name: pname || pid, source: "orphan" }); seen.add(pid); }
    }
    return merged.sort((a, b) => a.name.localeCompare(b.name));
  }, [customNames, guideNames]);

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
    // Coalesce — keep only string values so a NULL column can never turn a
    // textarea into an uncontrolled input.
    const merged: GuideForm = { ...EMPTY_FORM };
    if (data) {
      for (const k of Object.keys(EMPTY_FORM) as (keyof GuideForm)[]) {
        const v = (data as Record<string, unknown>)[k];
        if (typeof v === "string") merged[k] = v;
      }
    }
    setForm(merged);
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
    setGuideNames((prev) => ({ ...prev, [selected.id]: selected.name }));
    setSaved(true);
    toast.success("Guide saved.");
    setTimeout(() => setSaved(false), 2500);
  };

  // Shared delete core — used by both the editor and the product-picker list.
  // Managers are allowed to DELETE product_guides under RLS (FOR ALL policy),
  // so this removes the row for everyone and refreshes the local list.
  const performDelete = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from("product_guides").delete().eq("product_id", id);
    if (error) {
      toast.error("Error deleting guide.");
      return false;
    }
    setGuideNames((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    toast.success("Guide deleted.");
    return true;
  };

  const deleteGuide = async () => {
    if (!selected) return;
    if (!window.confirm(`Delete the guide for "${selected.name}"? This cannot be undone.`)) return;
    setSaving(true);
    const ok = await performDelete(selected.id);
    setSaving(false);
    if (ok) setSelected(null);
  };

  // Delete straight from the product list, without opening the editor.
  const deleteFromList = async (p: ProductRef) => {
    if (!window.confirm(`Delete the guide for "${p.name}"? This cannot be undone.`)) return;
    setDeletingId(p.id);
    await performDelete(p.id);
    setDeletingId(null);
  };

  // ─── Editor view ───────────────────────────────────────────────────────────
  if (selected) {
    const hasGuide = selected.id in guideNames;
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

        {selected.source === "orphan" && (
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-300">
            ⚠ This product is no longer in the catalog. The guide still exists — edit it or delete it below.
          </p>
        )}

        {loadingGuide ? (
          <div className="py-12 text-center text-xs text-muted-foreground">Loading guide…</div>
        ) : (
          <>
            {/* Video link — single YouTube URL, not language-specific */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <label className="block text-xs font-semibold text-foreground">🎬 Video link (YouTube)</label>
              <p className="text-[10px] text-muted-foreground">
                Optional. The 30-second product explainer — consultants watch it inline at /consulente.
              </p>
              <input
                type="url"
                value={form.video_url}
                onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
                placeholder="https://youtube.com/watch?v=…"
                className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

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

            {/* Delete — only when a guide row actually exists */}
            {hasGuide && (
              <button
                onClick={deleteGuide}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive active:scale-95 disabled:opacity-60"
              >
                <Trash2 className="h-3 w-3" /> Delete this guide
              </button>
            )}
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
            const hasGuide = p.id in guideNames;
            const isOrphan = p.source === "orphan";
            return (
              <div
                key={p.id}
                className="flex w-full items-center gap-2 rounded-xl border border-border bg-card py-3 pl-4 pr-2 transition-colors hover:border-primary/40"
              >
                <button
                  onClick={() => openEditor(p)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left active:scale-[0.99]"
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    isOrphan ? "bg-amber-500/15 text-amber-400"
                    : hasGuide ? "bg-green-500/15 text-green-400"
                    : "bg-muted/40 text-muted-foreground"
                  }`}>
                    <BookOpen className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {isOrphan ? "Guide for a removed product" : hasGuide ? "Guide published" : "No guide yet"}
                    </p>
                  </div>
                </button>
                {(hasGuide || isOrphan) && (
                  <button
                    onClick={() => deleteFromList(p)}
                    disabled={deletingId === p.id}
                    aria-label={`Delete guide for ${p.name}`}
                    title="Delete guide"
                    className="flex shrink-0 items-center justify-center rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-destructive transition-colors hover:bg-destructive/20 active:scale-95 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
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
