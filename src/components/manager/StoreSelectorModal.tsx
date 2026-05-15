import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { STORES } from "@/data/stores";

interface StoreSelectorModalProps {
  currentId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export const StoreSelectorModal = ({ currentId, onSelect, onClose }: StoreSelectorModalProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus trap
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
          e.preventDefault();
          (e.shiftKey ? last : first)?.focus();
        }
      }
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", trap);
    return () => document.removeEventListener("keydown", trap);
  }, [onClose]);

  return (
    <motion.div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="store-modal-title"
        className="w-full max-w-sm rounded-3xl border border-border bg-card p-8 shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="mb-6 text-center">
          <div className="mb-2 text-4xl">📍</div>
          <h2 id="store-modal-title" className="text-lg font-bold text-foreground">Cambia Sede</h2>
          <p className="mt-1 text-xs text-foreground/70">Seleziona la sede di questo dispositivo</p>
        </div>
        <div className="space-y-2.5">
          {STORES.map((store) => {
            const isActive = store.id === currentId;
            return (
              <motion.button
                key={store.id}
                onClick={() => onSelect(store.id)}
                className={`w-full min-h-[44px] rounded-2xl border px-5 py-3 text-left transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-secondary text-foreground hover:border-primary/40"
                }`}
                whileTap={{ scale: 0.97 }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{store.name}</span>
                  {isActive && <span className="text-xs font-bold text-primary">✓ Attuale</span>}
                </div>
              </motion.button>
            );
          })}
        </div>
        <button
          onClick={onClose}
          className="mt-5 w-full min-h-[44px] text-center text-sm text-foreground/70 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
        >
          Annulla
        </button>
      </motion.div>
    </motion.div>
  );
};
