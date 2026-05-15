import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, Globe, GripVertical, Pencil, Plus, RotateCcw, X } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { QuizCard } from "@/data/quiz-cards";

const EMPTY_FORM = {
  emoji: "❓",
  tag: "",
  text_it: "",
  text_en: "" as string,
  text_pt: "" as string,
  text_es: "" as string,
  text_fr: "" as string,
};

type CardForm = typeof EMPTY_FORM;

function tagToSlug(tag: string): string {
  return tag.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

// ── Card preview ──────────────────────────────────────────────────────────────
function CardPreview({ form, totalCards }: { form: CardForm; totalCards: number }) {
  const cardBg = "linear-gradient(158deg, hsl(228,52%,20%) 0%, hsl(228,68%,11%) 100%)";
  const text = form.text_it.trim() || "Testo della domanda…";
  const emoji = form.emoji.trim() || "❓";
  const tag = tagToSlug(form.tag) || "categoria";
  const step = String(1).padStart(2, "0");
  const total = String(Math.max(totalCards, 1)).padStart(2, "0");

  return (
    <div className="col-span-2 mt-1">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
        Anteprima carta
      </p>
      <div
        className="relative mx-auto w-full max-w-[220px] rounded-[18px] overflow-hidden select-none"
        style={{ background: cardBg, border: "1px solid rgba(255,255,255,0.09)", aspectRatio: "3/5" }}
      >
        <div style={{ height: 3, background: "linear-gradient(90deg,hsl(27,92%,55%),hsl(16,100%,50%))" }} />
        <div className="flex flex-col h-full pb-4">
          <div className="flex items-center justify-between px-3 pt-2.5">
            <div className="flex items-center gap-1.5">
              <div className="h-1 w-1 rounded-full" style={{ background: "hsl(27,92%,58%)", opacity: 0.85 }} />
              <span className="text-[8px] font-bold uppercase tracking-[0.2em]" style={{ color: "hsla(27,88%,72%,0.82)" }}>
                {tag}
              </span>
            </div>
            <span className="tabular-nums text-[8px] font-semibold" style={{ color: "hsla(27,88%,72%,0.60)" }}>
              {step}<span style={{ opacity: 0.5 }}>&thinsp;/&thinsp;{total}</span>
            </span>
          </div>
          <div className="mx-3 mt-1.5" style={{ height: 1, background: "linear-gradient(to right,transparent,rgba(255,255,255,0.08),transparent)" }} />
          <div className="flex flex-1 items-center justify-center">
            <span style={{ fontSize: 52, lineHeight: 1 }}>{emoji}</span>
          </div>
          <div className="mx-3" style={{ height: 1, background: "linear-gradient(to right,transparent,rgba(255,255,255,0.08),transparent)" }} />
          <div className="px-4 pt-2 text-center">
            <p className="text-[9px] font-bold leading-snug text-white" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.9)" }}>
              {text}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Audit helper ───────────────────────────────────────────────────────────────
async function logAudit(action: string, cardId: number | null, cardTag: string, newActive?: boolean) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("manager_audit_log").insert({
    user_id: user.id,
    user_email: user.email ?? null,
    product_id: `quiz_card:${cardId ?? cardTag}`,
    action,
    new_active: newActive ?? null,
  });
}

// ── Skeleton loader ─────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 animate-pulse">
          <div className="h-5 w-4 rounded bg-muted/50 shrink-0" />
          <div className="h-9 w-9 rounded-lg bg-muted/50 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-24 rounded bg-muted/50" />
            <div className="h-4 w-48 rounded bg-muted/40" />
          </div>
          <div className="flex gap-1 shrink-0">
            <div className="h-8 w-8 rounded-xl bg-muted/50" />
            <div className="h-8 w-8 rounded-xl bg-muted/40" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Sortable card row ──────────────────────────────────────────────────────────
function SortableCard({
  card,
  selected,
  onSelect,
  onEdit,
  onToggle,
  togglingId,
}: {
  card: QuizCard;
  selected: boolean;
  onSelect: (id: number, checked: boolean) => void;
  onEdit: (card: QuizCard) => void;
  onToggle: (card: QuizCard) => void;
  togglingId: number | null;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      className={`flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 ${card.active ? "" : "opacity-50"}`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground touch-none"
        title="Trascina per riordinare"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Bulk select checkbox */}
      <input
        type="checkbox"
        checked={selected}
        onChange={(e) => onSelect(card.id, e.target.checked)}
        className="h-4 w-4 shrink-0 cursor-pointer"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Emoji */}
      <div className="shrink-0 w-10 text-center text-2xl select-none">{card.emoji}</div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-mono font-medium text-muted-foreground">
            {card.tag}
          </span>
          <span className="text-[10px] text-muted-foreground/50">#{card.sort_order}</span>
          <div className="flex items-center gap-0.5 ml-1">
            {(["en", "pt", "es", "fr"] as const).map((lang) => {
              const key = `text_${lang}` as keyof QuizCard;
              const hasTranslation = !!(card[key]);
              return (
                <span
                  key={lang}
                  title={`${lang.toUpperCase()}: ${hasTranslation ? "✓" : "usa italiano"}`}
                  className={`text-[8px] font-bold rounded-sm px-0.5 ${hasTranslation ? "text-green-400 bg-green-400/10" : "text-muted-foreground/30 bg-muted/20"}`}
                >
                  {lang.toUpperCase()}
                </span>
              );
            })}
          </div>
        </div>
        <p className="mt-0.5 truncate text-sm text-foreground">{card.text_it}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onEdit(card)}
          className="rounded-xl p-2 text-muted-foreground hover:text-foreground active:scale-95"
          title="Modifica"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onToggle(card)}
          disabled={togglingId === card.id}
          title={card.active ? "Nascondi carta" : "Attiva carta"}
          className={`rounded-xl p-2 transition-colors active:scale-95 ${
            card.active ? "bg-green-500/10 text-green-400" : "bg-muted/40 text-muted-foreground"
          }`}
        >
          {card.active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        </button>
      </div>
    </motion.div>
  );
}

export function QuizCardsTab() {
  const [cards, setCards] = useState<QuizCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CardForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [showTranslateInfo, setShowTranslateInfo] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkWorking, setBulkWorking] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const fetchCards = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const { data, error } = await supabase
      .from("quiz_cards")
      .select("id, emoji, tag, sort_order, active, text_it, text_en, text_pt, text_es, text_fr")
      .order("sort_order", { ascending: true });
    if (error) {
      setLoadError(error.message);
    } else {
      setCards((data ?? []) as QuizCard[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  const openAddForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowForm(true);
  };

  const openEditForm = (card: QuizCard) => {
    setEditingId(card.id);
    setForm({
      emoji: card.emoji,
      tag: card.tag,
      text_it: card.text_it,
      text_en: card.text_en ?? "",
      text_pt: card.text_pt ?? "",
      text_es: card.text_es ?? "",
      text_fr: card.text_fr ?? "",
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

  const saveCard = async () => {
    if (!form.emoji.trim()) { setFormError("L'emoji è obbligatoria."); return; }
    if (!form.tag.trim()) { setFormError("Il tag categoria è obbligatorio."); return; }
    if (!form.text_it.trim()) { setFormError("Il testo in italiano è obbligatorio."); return; }

    const slug = tagToSlug(form.tag);
    if (!slug) { setFormError("Tag non valido — usa solo lettere e trattini."); return; }

    setSaving(true);
    setFormError(null);

    const payload = {
      emoji: form.emoji.trim(),
      tag: slug,
      text_it: form.text_it.trim(),
      text_en: form.text_en.trim() || null,
      text_pt: form.text_pt.trim() || null,
      text_es: form.text_es.trim() || null,
      text_fr: form.text_fr.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (editingId !== null) {
      const { error } = await supabase.from("quiz_cards").update(payload).eq("id", editingId);
      if (error) { setFormError(error.message); setSaving(false); return; }
      logAudit("quiz_card_edit", editingId, slug);
      toast.success("Carta aggiornata.");
    } else {
      const maxOrder = cards.reduce((m, c) => Math.max(m, c.sort_order), 0);
      const { data: inserted, error } = await supabase
        .from("quiz_cards")
        .insert({ ...payload, sort_order: maxOrder + 1, active: true })
        .select("id")
        .single();
      if (error) { setFormError(error.message); setSaving(false); return; }
      logAudit("quiz_card_add", inserted?.id ?? null, slug, true);
      toast.success("Carta aggiunta al quiz.");
    }

    await fetchCards();
    cancelForm();
    setSaving(false);
  };

  const toggleActive = async (card: QuizCard) => {
    setTogglingId(card.id);
    await supabase.from("quiz_cards").update({ active: !card.active, updated_at: new Date().toISOString() }).eq("id", card.id);
    logAudit("quiz_card_toggle", card.id, card.tag, !card.active);
    setCards((prev) => prev.map((c) => c.id === card.id ? { ...c, active: !c.active } : c));
    setTogglingId(null);
  };

  // ── Drag end: reorder + persist ─────────────────────────────────────────────
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = cards.findIndex((c) => c.id === active.id);
    const newIndex = cards.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(cards, oldIndex, newIndex).map((c, i) => ({
      ...c,
      sort_order: i + 1,
    }));
    setCards(reordered);

    // Persist new sort_order for affected cards
    await Promise.all(
      reordered.map((c) =>
        supabase.from("quiz_cards").update({ sort_order: c.sort_order, updated_at: new Date().toISOString() }).eq("id", c.id)
      )
    );
    logAudit("quiz_card_reorder", null, "batch");
  };

  // ── Bulk actions ─────────────────────────────────────────────────────────────
  const handleSelect = (id: number, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    setSelected(checked ? new Set(cards.map((c) => c.id)) : new Set());
  };

  const bulkToggle = async (targetActive: boolean) => {
    setBulkWorking(true);
    await Promise.all(
      [...selected].map((id) =>
        supabase.from("quiz_cards").update({ active: targetActive, updated_at: new Date().toISOString() }).eq("id", id)
      )
    );
    setCards((prev) => prev.map((c) => selected.has(c.id) ? { ...c, active: targetActive } : c));
    toast.success(`${selected.size} carte ${targetActive ? "attivate" : "disattivate"}.`);
    setSelected(new Set());
    setBulkWorking(false);
  };

  const activeCount = cards.filter((c) => c.active).length;
  const allSelected = cards.length > 0 && selected.size === cards.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Carte del Quiz</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {loading ? "Caricamento…" : `${activeCount} di ${cards.length} carte attive nel quiz`}
          </p>
        </div>
        <button
          onClick={openAddForm}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" /> Nuova carta
        </button>
      </div>

      {/* Info banner */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
        💡 Trascina le carte per riordinarle. Usa le checkbox per azioni in blocco. Le carte attive compaiono nel quiz nell'ordine indicato.
      </div>

      {/* Add / Edit form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border border-primary/30 bg-card p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                {editingId !== null ? "Modifica carta" : "Nuova carta"}
              </h3>
              <button onClick={cancelForm} className="text-muted-foreground active:scale-95">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-medium text-muted-foreground mb-1">Emoji centrale *</label>
                <input
                  type="text"
                  value={form.emoji}
                  onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
                  placeholder="🏋️"
                  className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-2xl text-center focus:outline-none focus:ring-1 focus:ring-primary"
                  maxLength={4}
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-muted-foreground mb-1">
                  Tag categoria * <span className="font-normal">(slug, es. "coffee")</span>
                </label>
                <input
                  type="text"
                  value={form.tag}
                  onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))}
                  placeholder="es. coffee"
                  className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="mt-1 text-[10px] text-muted-foreground/60">
                  Il tag apparirà automaticamente nel modulo prodotti.
                </p>
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] font-medium text-muted-foreground mb-1">
                  Testo domanda — Italiano *
                </label>
                <textarea
                  value={form.text_it}
                  onChange={(e) => setForm((f) => ({ ...f, text_it: e.target.value }))}
                  rows={2}
                  placeholder="Es. Ami il caffè di qualità anche in viaggio?"
                  className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <CardPreview form={form} totalCards={cards.length || 1} />

              <div className="col-span-2 rounded-xl border border-border/50 bg-muted/10 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Traduzioni (opzionali)
                  </span>
                  <button
                    type="button"
                    disabled
                    title="Traduzione automatica non ancora disponibile"
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground/40 cursor-not-allowed opacity-50"
                  >
                    <Globe className="h-3 w-3" />
                    🌐 Traduci
                  </button>
                </div>

                <div
                  className="rounded-lg bg-amber-500/8 border border-amber-500/20 px-3 py-2 text-[10px] text-amber-400/70 leading-relaxed cursor-pointer"
                  onClick={() => setShowTranslateInfo((v) => !v)}
                >
                  <span className="font-semibold">ℹ️ Traduzione automatica</span>
                  {showTranslateInfo ? (
                    <p className="mt-1">
                      La traduzione automatica sarà disponibile in futuro. Puoi inserire le traduzioni manualmente.
                    </p>
                  ) : (
                    <span className="ml-1 opacity-60">— tappa per i dettagli</span>
                  )}
                </div>

                {[
                  { key: "text_en" as const, label: "🇬🇧 English" },
                  { key: "text_pt" as const, label: "🇧🇷 Português" },
                  { key: "text_es" as const, label: "🇪🇸 Español" },
                  { key: "text_fr" as const, label: "🇫🇷 Français" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-[10px] font-medium text-muted-foreground/60 mb-1">{label}</label>
                    <input
                      type="text"
                      value={form[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      placeholder="Lascia vuoto → usa il testo italiano"
                      className="w-full rounded-xl border border-border/50 bg-muted/20 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/35 focus:outline-none focus:ring-1 focus:ring-primary/50"
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
                onClick={saveCard}
                disabled={saving}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground active:scale-95 disabled:opacity-60"
              >
                {saving ? "Salvataggio…" : editingId !== null ? "Aggiorna" : "Aggiungi carta"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card list */}
      {loading ? (
        <CardSkeleton />
      ) : loadError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 py-12 text-center">
          <p className="text-2xl mb-2">⚠️</p>
          <p className="text-sm font-medium text-destructive">Errore nel caricamento delle carte</p>
          <p className="text-xs text-muted-foreground mt-1">{loadError}</p>
        </div>
      ) : cards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/10 py-12 text-center">
          <p className="text-2xl mb-2">🃏</p>
          <p className="text-sm font-medium text-foreground">Nessuna carta trovata</p>
          <p className="text-xs text-muted-foreground mt-1">Clicca "Nuova carta" per crearne una.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Bulk action header */}
          <div className="flex items-center gap-3 px-1">
            <input
              type="checkbox"
              id="select-all-cards"
              checked={allSelected}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="h-4 w-4 cursor-pointer"
            />
            <label htmlFor="select-all-cards" className="text-xs text-muted-foreground cursor-pointer select-none">
              Seleziona tutti ({cards.length})
            </label>
            <AnimatePresence>
              {selected.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                  className="flex items-center gap-2 ml-2"
                >
                  <span className="text-xs font-semibold text-primary">{selected.size} selezionate</span>
                  <button
                    onClick={() => bulkToggle(true)}
                    disabled={bulkWorking}
                    className="flex items-center gap-1 rounded-full border border-green-500/40 bg-green-500/10 px-2.5 py-1 text-[10px] font-semibold text-green-400 active:scale-95 disabled:opacity-50"
                  >
                    <Eye className="h-3 w-3" /> Attiva
                  </button>
                  <button
                    onClick={() => bulkToggle(false)}
                    disabled={bulkWorking}
                    className="flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-400 active:scale-95 disabled:opacity-50"
                  >
                    <EyeOff className="h-3 w-3" /> Disattiva
                  </button>
                  <button
                    onClick={() => setSelected(new Set())}
                    className="text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    Annulla
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Draggable list */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              {cards.map((card) => (
                <SortableCard
                  key={card.id}
                  card={card}
                  selected={selected.has(card.id)}
                  onSelect={handleSelect}
                  onEdit={openEditForm}
                  onToggle={toggleActive}
                  togglingId={togglingId}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Refresh */}
      <div className="flex justify-center">
        <button
          onClick={fetchCards}
          className="flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground active:scale-95"
        >
          <RotateCcw className="h-3 w-3" /> Aggiorna carte
        </button>
      </div>
    </div>
  );
}
