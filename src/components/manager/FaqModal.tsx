import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";

export interface FaqData {
  q1: string; a1: string;
  q2: string; a2: string;
  q3: string; a3: string;
}

export const EMPTY_FAQ: FaqData = { q1: "", a1: "", q2: "", a2: "", q3: "", a3: "" };

interface FaqModalProps {
  productName: string;
  initial: FaqData;
  onSave: (data: FaqData) => Promise<void>;
  onClose: () => void;
}

export const FaqModal = ({ productName, initial, onSave, onClose }: FaqModalProps) => {
  const [data, setData] = useState<FaqData>(initial);
  const [saving, setSaving] = useState(false);

  const update = (key: keyof FaqData, value: string) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    await onSave(data);
    setSaving(false);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      // intentionally no onClick to dismiss — only X or Save can close
    >
      <motion.div
        className="relative w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl"
        style={{ maxHeight: "88vh" }}
        initial={{ scale: 0.92, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 16 }}
        transition={{ type: "spring", stiffness: 420, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* X — transparent, top-right */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground/40 transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="mb-6 pr-8">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-primary">
            FAQ
          </p>
          <h2 className="text-lg font-bold leading-snug text-foreground">{productName}</h2>
        </div>

        {/* 3 Q&A pairs */}
        <div className="space-y-4">
          {([1, 2, 3] as const).map((n) => (
            <div
              key={n}
              className="rounded-2xl border border-border bg-background/50 p-4"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-black text-primary">
                  {n}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Domanda {n}
                </span>
              </div>

              <input
                value={data[`q${n}` as keyof FaqData]}
                onChange={(e) => update(`q${n}` as keyof FaqData, e.target.value)}
                placeholder={`Inserisci la domanda ${n}…`}
                className="mb-3 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary"
              />

              <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Risposta
              </label>
              <textarea
                value={data[`a${n}` as keyof FaqData]}
                onChange={(e) => update(`a${n}` as keyof FaqData, e.target.value)}
                placeholder={`Inserisci la risposta ${n}…`}
                rows={3}
                className="w-full resize-none rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          ))}
        </div>

        <div className="my-5 border-t border-border/50" />

        {/* Save — only opaque exit */}
        <motion.button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-2xl gradient-primary py-3.5 text-sm font-bold text-white shadow-glow disabled:opacity-50"
          whileTap={{ scale: 0.98 }}
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Salvataggio…
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Check className="h-4 w-4" />
              Salva FAQ — {productName}
            </span>
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  );
};
