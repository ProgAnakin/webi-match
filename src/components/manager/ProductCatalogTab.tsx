import { useState, useEffect, useCallback } from "react";
import { Eye, EyeOff, Pencil, Plus, RotateCcw, Trash2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { products as coreProducts } from "@/data/products";
import { AVAILABLE_TAGS } from "@/data/products";

// Load distinct active tags from quiz_cards so new custom cards surface in the picker.
async function fetchActiveTags(): Promise<string[]> {
  const { data } = await supabase
    .from("quiz_cards")
    .select("tag")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (!data || data.length === 0) return [...AVAILABLE_TAGS];
  const fromDb = Array.from(new Set(data.map((r: { tag: string }) => r.tag)));
  // Merge with static fallback so existing tags are always present even if DB is slow
  const merged = Array.from(new Set([...fromDb, ...AVAILABLE_TAGS]));
  return merged.sort();
}

interface CustomProductRow {
  id: string;
  name: string;
  description: string;
  price: string;
  rating: number;
  image_url: string | null;
  video_url: string;
  tags: string[];
  faq: { q: string; a: string }[];
  status: "active" | "archived";
}

interface GlobalStatusRow {
  product_id: string;
  hidden: boolean;
}

const EMPTY_FORM: Omit<CustomProductRow, "status"> = {
  id: "",
  name: "",
  description: "",
  price: "€",
  rating: 4.5,
  image_url: null,
  video_url: "#",
  tags: [],
  faq: [{ q: "", a: "" }, { q: "", a: "" }, { q: "", a: "" }],
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ProductCatalogTab() {
  const [customProducts, setCustomProducts] = useState<CustomProductRow[]>([]);
  const [globalStatus, setGlobalStatus] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [availableTags, setAvailableTags] = useState<string[]>([...AVAILABLE_TAGS]);
  const [showArchived, setShowArchived] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<CustomProductRow, "status">>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [customRes, globalRes] = await Promise.all([
      supabase.from("custom_products").select("*").order("created_at", { ascending: false }),
      supabase.from("product_global_status").select("product_id, hidden"),
    ]);
    setCustomProducts((customRes.data ?? []) as CustomProductRow[]);
    const map: Record<string, boolean> = {};
    (globalRes.data ?? []).forEach((r: GlobalStatusRow) => { map[r.product_id] = r.hidden; });
    setGlobalStatus(map);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    fetchActiveTags().then(setAvailableTags);
  }, []);

  const openAddForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowForm(true);
  };

  const openEditForm = (p: CustomProductRow) => {
    setEditingId(p.id);
    setForm({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      rating: p.rating,
      image_url: p.image_url,
      video_url: p.video_url,
      tags: p.tags,
      faq: p.faq.length > 0
        ? [...p.faq, ...Array(3 - Math.min(p.faq.length, 3)).fill({ q: "", a: "" })].slice(0, 3)
        : [{ q: "", a: "" }, { q: "", a: "" }, { q: "", a: "" }],
    });
    setFormError(null);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  };

  const handleNameChange = (name: string) => {
    setForm((f) => ({
      ...f,
      name,
      // Auto-generate id only when creating a new product
      ...(editingId === null ? { id: slugify(name) } : {}),
    }));
  };

  const toggleTag = (tag: string) => {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
  };

  const updateFaq = (index: number, field: "q" | "a", value: string) => {
    setForm((f) => {
      const faq = [...f.faq];
      faq[index] = { ...faq[index], [field]: value };
      return { ...f, faq };
    });
  };

  const uploadImage = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setFormError("Immagine troppo grande — massimo 5 MB.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setFormError("Formato non supportato — usa JPEG, PNG o WebP.");
      return;
    }
    setUploadingImage(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const targetId = form.id || `new-${Date.now()}`;
    const path = `custom/${targetId}.${ext}`;
    const { error } = await supabase.storage
      .from("product-images")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      setFormError("Errore upload immagine: " + error.message);
      setUploadingImage(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
    setForm((f) => ({ ...f, image_url: urlData.publicUrl }));
    setUploadingImage(false);
  };

  const saveProduct = async () => {
    if (!form.name.trim()) { setFormError("Il nome è obbligatorio."); return; }
    if (form.name.trim().length > 60) { setFormError("Nome troppo lungo — massimo 60 caratteri."); return; }
    if (!form.id.trim()) { setFormError("L'ID prodotto è obbligatorio."); return; }
    if (!form.description.trim()) { setFormError("La descrizione è obbligatoria."); return; }
    if (form.description.trim().length > 300) { setFormError("Descrizione troppo lunga — massimo 300 caratteri."); return; }
    if (!form.price.trim() || form.price === "€") { setFormError("Il prezzo è obbligatorio."); return; }
    if (!/^€?\d+([.,]\d{1,2})?$/.test(form.price.trim())) { setFormError("Formato prezzo non valido (es. €79,00 oppure 79.00)."); return; }
    if (form.tags.length === 0) { setFormError("Seleziona almeno un tag di corrispondenza."); return; }

    setSaving(true);
    setFormError(null);

    const faqFiltered = form.faq.filter((f) => f.q.trim() || f.a.trim());
    const payload = {
      id: form.id.trim(),
      name: form.name.trim(),
      description: form.description.trim(),
      price: form.price.trim(),
      rating: form.rating,
      image_url: form.image_url,
      video_url: form.video_url.trim() || "#",
      tags: form.tags,
      faq: faqFiltered,
      status: "active" as const,
      updated_at: new Date().toISOString(),
    };

    const { error } = editingId
      ? await supabase.from("custom_products").update(payload).eq("id", editingId)
      : await supabase.from("custom_products").insert(payload);

    if (error) {
      setFormError(error.message);
      setSaving(false);
      return;
    }
    await fetchData();
    cancelForm();
    setSaving(false);
  };

  const archiveProduct = async (id: string, archive: boolean) => {
    setDeletingId(id);
    await supabase
      .from("custom_products")
      .update({ status: archive ? "archived" : "active", updated_at: new Date().toISOString() })
      .eq("id", id);
    await fetchData();
    setDeletingId(null);
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm(`Eliminare definitivamente il prodotto "${id}"? L'azione è irreversibile.`)) return;
    setDeletingId(id);
    await supabase.from("custom_products").delete().eq("id", id);
    await fetchData();
    setDeletingId(null);
  };

  const toggleGlobalHidden = async (productId: string) => {
    setTogglingId(productId);
    const currentlyHidden = globalStatus[productId] ?? false;
    const newHidden = !currentlyHidden;
    await supabase.from("product_global_status").upsert({
      product_id: productId,
      hidden: newHidden,
      updated_at: new Date().toISOString(),
    });
    setGlobalStatus((prev) => ({ ...prev, [productId]: newHidden }));
    setTogglingId(null);
  };

  const visibleCustom = customProducts.filter((p) => showArchived || p.status === "active");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Gestione Catalogo Globale</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Aggiungi nuovi prodotti o nascondi quelli esistenti in tutte le store.
          </p>
        </div>
        <button
          onClick={openAddForm}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" /> Aggiungi
        </button>
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div className="rounded-2xl border border-primary/30 bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              {editingId ? "Modifica prodotto" : "Nuovo prodotto"}
            </h3>
            <button onClick={cancelForm} className="text-muted-foreground active:scale-95">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Name */}
            <div className="col-span-2">
              <label className="block text-[10px] font-medium text-muted-foreground mb-1">Nome *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Es. AirPods Pro 3"
                className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* ID */}
            <div className="col-span-2">
              <label className="block text-[10px] font-medium text-muted-foreground mb-1">
                ID prodotto * <span className="font-normal">(auto-generato, modificabile)</span>
              </label>
              <input
                type="text"
                value={form.id}
                onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
                placeholder="es. airpods-pro-3"
                disabled={!!editingId}
                className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
            </div>

            {/* Description */}
            <div className="col-span-2">
              <label className="block text-[10px] font-medium text-muted-foreground mb-1">Descrizione *</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="Descrizione breve do produto…"
                className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-[10px] font-medium text-muted-foreground mb-1">Prezzo *</label>
              <input
                type="text"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="€79,00"
                className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Rating */}
            <div>
              <label className="block text-[10px] font-medium text-muted-foreground mb-1">
                Rating ({form.rating.toFixed(1)})
              </label>
              <input
                type="range"
                min={1}
                max={5}
                step={0.1}
                value={form.rating}
                onChange={(e) => setForm((f) => ({ ...f, rating: parseFloat(e.target.value) }))}
                className="w-full mt-2"
              />
            </div>

            {/* Video URL */}
            <div className="col-span-2">
              <label className="block text-[10px] font-medium text-muted-foreground mb-1">URL Video</label>
              <input
                type="text"
                value={form.video_url}
                onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
                placeholder="https://youtube.com/..."
                className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Image upload */}
            <div className="col-span-2">
              <label className="block text-[10px] font-medium text-muted-foreground mb-1">Immagine prodotto</label>
              <div className="flex items-center gap-3">
                {form.image_url && (
                  <img
                    src={form.image_url}
                    alt="Preview"
                    className="h-12 w-12 rounded-xl object-cover border border-border"
                  />
                )}
                <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-dashed border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground active:scale-95 hover:border-primary/40">
                  <Upload className="h-3.5 w-3.5" />
                  {uploadingImage ? "Caricamento…" : form.image_url ? "Cambia foto" : "Carica foto"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingImage}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = ""; }}
                  />
                </label>
                {!form.id && (
                  <span className="text-[10px] text-muted-foreground/60">Inserisci prima il nome per generare l'ID</span>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="col-span-2">
              <label className="block text-[10px] font-medium text-muted-foreground mb-2">
                Tag di corrispondenza * <span className="font-normal">(almeno 1, idealmente 3)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      form.tags.includes(tag)
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-muted/30 text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* FAQ */}
            <div className="col-span-2 space-y-3">
              <label className="block text-[10px] font-medium text-muted-foreground">FAQ (opzionale)</label>
              {form.faq.map((entry, i) => (
                <div key={i} className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={entry.q}
                    onChange={(e) => updateFaq(i, "q", e.target.value)}
                    placeholder={`Domanda ${i + 1}`}
                    className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <input
                    type="text"
                    value={entry.a}
                    onChange={(e) => updateFaq(i, "a", e.target.value)}
                    placeholder={`Risposta ${i + 1}`}
                    className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              ))}
            </div>
          </div>

          {formError && (
            <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">{formError}</p>
          )}

          <div className="flex justify-end gap-2">
            <button
              onClick={cancelForm}
              className="rounded-xl border border-border bg-muted/20 px-4 py-2 text-xs text-muted-foreground active:scale-95"
            >
              Annulla
            </button>
            <button
              onClick={saveProduct}
              disabled={saving}
              className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground active:scale-95 disabled:opacity-60"
            >
              {saving ? "Salvataggio…" : editingId ? "Aggiorna" : "Aggiungi al catalogo"}
            </button>
          </div>
        </div>
      )}

      {/* Core products — global visibility */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Prodotti base ({coreProducts.length})
          </h3>
          <span className="text-[10px] text-muted-foreground/60">Disattiva per nasconderli da tutte le store</span>
        </div>
        {coreProducts.map((p) => {
          const hidden = globalStatus[p.id] ?? false;
          return (
            <div
              key={p.id}
              className={`flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 ${hidden ? "opacity-50" : ""}`}
            >
              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-muted/30">
                <img src={p.image} alt={p.name} loading="lazy" decoding="async" className="h-full w-full object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.price} · {p.tags.join(", ")}</p>
              </div>
              <button
                onClick={() => toggleGlobalHidden(p.id)}
                disabled={togglingId === p.id}
                title={hidden ? "Mostra in tutte le store" : "Nascondi da tutte le store"}
                className={`shrink-0 rounded-xl p-2 transition-colors active:scale-95 ${
                  hidden
                    ? "bg-muted/40 text-muted-foreground"
                    : "bg-green-500/10 text-green-400"
                }`}
              >
                {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          );
        })}
      </div>

      {/* Custom products */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Prodotti aggiunti ({customProducts.filter((p) => p.status === "active").length} attivi
            {customProducts.some((p) => p.status === "archived") && ` · ${customProducts.filter((p) => p.status === "archived").length} archiviati`})
          </h3>
          {customProducts.some((p) => p.status === "archived") && (
            <button
              onClick={() => setShowArchived((v) => !v)}
              className="text-[10px] text-muted-foreground/70 hover:text-muted-foreground"
            >
              {showArchived ? "Nascondi archiviati" : "Mostra archiviati"}
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-muted-foreground">Caricamento…</div>
        ) : visibleCustom.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/10 py-10 text-center">
            <p className="text-2xl mb-2">📦</p>
            <p className="text-sm font-medium text-foreground">Nessun prodotto custom</p>
            <p className="text-xs text-muted-foreground mt-1">Clicca "Aggiungi" per creare il primo.</p>
          </div>
        ) : (
          visibleCustom.map((p) => {
            const hidden = globalStatus[p.id] ?? false;
            const isArchived = p.status === "archived";
            return (
              <div
                key={p.id}
                className={`flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 ${isArchived || hidden ? "opacity-50" : ""}`}
              >
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    loading="lazy"
                    decoding="async"
                    className="h-9 w-9 shrink-0 rounded-lg object-contain bg-muted/30"
                  />
                ) : (
                  <div className="h-9 w-9 shrink-0 rounded-lg bg-muted/30 flex items-center justify-center text-muted-foreground text-xs">
                    📷
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
                    {isArchived && (
                      <span className="shrink-0 rounded-full bg-muted/40 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                        Archiviato
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{p.price} · {p.tags.join(", ")}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {/* Global hide toggle */}
                  {!isArchived && (
                    <button
                      onClick={() => toggleGlobalHidden(p.id)}
                      disabled={togglingId === p.id}
                      title={hidden ? "Mostra" : "Nascondi"}
                      className={`rounded-xl p-2 transition-colors active:scale-95 ${
                        hidden ? "bg-muted/40 text-muted-foreground" : "bg-green-500/10 text-green-400"
                      }`}
                    >
                      {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  )}
                  {/* Edit */}
                  {!isArchived && (
                    <button
                      onClick={() => openEditForm(p)}
                      className="rounded-xl p-2 text-muted-foreground hover:text-foreground active:scale-95"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {/* Archive / Restore */}
                  <button
                    onClick={() => archiveProduct(p.id, !isArchived)}
                    disabled={deletingId === p.id}
                    title={isArchived ? "Ripristina" : "Archivia"}
                    className="rounded-xl p-2 text-muted-foreground hover:text-foreground active:scale-95"
                  >
                    {isArchived ? <RotateCcw className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                  {/* Delete (only archived) */}
                  {isArchived && (
                    <button
                      onClick={() => deleteProduct(p.id)}
                      disabled={deletingId === p.id}
                      title="Elimina definitivamente"
                      className="rounded-xl p-2 text-destructive/70 hover:text-destructive active:scale-95"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Refresh */}
      <div className="flex justify-center">
        <button
          onClick={fetchData}
          className="flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground active:scale-95"
        >
          <RotateCcw className="h-3 w-3" /> Aggiorna catalogo
        </button>
      </div>
    </div>
  );
}
