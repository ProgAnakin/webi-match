import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, Eye, EyeOff, Globe, Pencil, Plus, RotateCcw, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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

export function QuizCardsTab() {
  const [cards, setCards] = useState<QuizCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CardForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [reorderingId, setReorderingId] = useState<number | null>(null);
  const [showTranslateInfo, setShowTranslateInfo] = useState(false);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("quiz_cards")
      .select("id, emoji, tag, sort_order, active, text_it, text_en, text_pt, text_es, text_fr")
      .order("sort_order", { ascending: true });
    setCards((data ?? []) as QuizCard[]);
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
    } else {
      // New card goes to the end of the sort order
      const maxOrder = cards.reduce((m, c) => Math.max(m, c.sort_order), 0);
      const { error } = await supabase.from("quiz_cards").insert({ ...payload, sort_order: maxOrder + 1, active: true });
      if (error) { setFormError(error.message); setSaving(false); return; }
    }

    await fetchCards();
    cancelForm();
    setSaving(false);
  };

  const toggleActive = async (card: QuizCard) => {
    setTogglingId(card.id);
    await supabase.from("quiz_cards").update({ active: !card.active, updated_at: new Date().toISOString() }).eq("id", card.id);
    setCards((prev) => prev.map((c) => c.id === card.id ? { ...c, active: !c.active } : c));
    setTogglingId(null);
  };

  const moveCard = async (card: QuizCard, direction: "up" | "down") => {
    const idx = cards.findIndex((c) => c.id === card.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= cards.length) return;

    const other = cards[swapIdx];
    setReorderingId(card.id);

    await Promise.all([
      supabase.from("quiz_cards").update({ sort_order: other.sort_order, updated_at: new Date().toISOString() }).eq("id", card.id),
      supabase.from("quiz_cards").update({ sort_order: card.sort_order, updated_at: new Date().toISOString() }).eq("id", other.id),
    ]);

    // Optimistic update
    setCards((prev) => {
      const next = [...prev];
      const a = { ...next[idx], sort_order: other.sort_order };
      const b = { ...next[swapIdx], sort_order: card.sort_order };
      next[idx] = a;
      next[swapIdx] = b;
      return next.sort((x, y) => x.sort_order - y.sort_order);
    });
    setReorderingId(null);
  };

  const activeCount = cards.filter((c) => c.active).length;

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
        💡 Le carte attive compaiono nel quiz nell'ordine indicato. Aggiungi nuove carte con tag personalizzati — i nuovi tag appariranno automaticamente nel modulo prodotti.
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
              {/* Emoji */}
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

              {/* Tag */}
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

              {/* Italian text (primary) */}
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

              {/* Translation section */}
              <div className="col-span-2 rounded-xl border border-border/50 bg-muted/10 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Traduzioni (opzionali)
                  </span>
                  {/* Traduci button — built but disabled */}
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

                {/* Disabled notice */}
                <div
                  className="rounded-lg bg-amber-500/8 border border-amber-500/20 px-3 py-2 text-[10px] text-amber-400/70 leading-relaxed cursor-pointer"
                  onClick={() => setShowTranslateInfo((v) => !v)}
                >
                  <span className="font-semibold">ℹ️ Traduzione automatica</span>
                  {showTranslateInfo ? (
                    <p className="mt-1">
                      La traduzione automatica sarà disponibile in futuro con l'integrazione di un'API di traduzione.
                      La struttura è già predisposta — al momento l'app è completamente gratuita e senza costi esterni.
                      Puoi inserire le traduzioni manualmente nei campi qui sotto.
                    </p>
                  ) : (
                    <span className="ml-1 opacity-60">— tappa per i dettagli</span>
                  )}
                </div>

                {/* Manual translation fields */}
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
        <div className="py-12 text-center text-xs text-muted-foreground">Caricamento carte…</div>
      ) : cards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/10 py-12 text-center">
          <p className="text-2xl mb-2">🃏</p>
          <p className="text-sm font-medium text-foreground">Nessuna carta trovata</p>
          <p className="text-xs text-muted-foreground mt-1">Clicca "Nuova carta" per crearne una.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {cards.map((card, idx) => {
            const isFirst = idx === 0;
            const isLast  = idx === cards.length - 1;
            const isMoving = reorderingId === card.id;

            return (
              <motion.div
                key={card.id}
                layout
                className={`flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 ${card.active ? "" : "opacity-50"}`}
                animate={{ opacity: card.active ? 1 : 0.5 }}
              >
                {/* Sort order arrows */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    onClick={() => moveCard(card, "up")}
                    disabled={isFirst || isMoving}
                    className="rounded-md p-0.5 text-muted-foreground hover:text-foreground active:scale-95 disabled:opacity-20"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => moveCard(card, "down")}
                    disabled={isLast || isMoving}
                    className="rounded-md p-0.5 text-muted-foreground hover:text-foreground active:scale-95 disabled:opacity-20"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Emoji */}
                <div className="shrink-0 w-10 text-center text-2xl select-none">
                  {card.emoji}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-mono font-medium text-muted-foreground">
                      {card.tag}
                    </span>
                    <span className="text-[10px] text-muted-foreground/50">
                      #{card.sort_order}
                    </span>
                    {/* Language coverage dots */}
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
                  {/* Edit */}
                  <button
                    onClick={() => openEditForm(card)}
                    className="rounded-xl p-2 text-muted-foreground hover:text-foreground active:scale-95"
                    title="Modifica"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  {/* Toggle active */}
                  <button
                    onClick={() => toggleActive(card)}
                    disabled={togglingId === card.id}
                    title={card.active ? "Nascondi carta" : "Attiva carta"}
                    className={`rounded-xl p-2 transition-colors active:scale-95 ${
                      card.active
                        ? "bg-green-500/10 text-green-400"
                        : "bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    {card.active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </motion.div>
            );
          })}
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
