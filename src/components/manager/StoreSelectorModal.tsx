import { motion } from "framer-motion";
import { STORES } from "@/data/stores";

interface StoreSelectorModalProps {
  currentId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export const StoreSelectorModal = ({ currentId, onSelect, onClose }: StoreSelectorModalProps) => (
  <motion.div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    onClick={(e) => e.target === e.currentTarget && onClose()}
  >
    <motion.div
      className="w-full max-w-sm rounded-3xl border border-border bg-card p-8 shadow-2xl"
      initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
    >
      <div className="mb-6 text-center">
        <div className="mb-2 text-4xl">📍</div>
        <h2 className="text-lg font-bold text-foreground">Cambia Sede</h2>
        <p className="mt-1 text-xs text-muted-foreground">Seleziona la sede di questo dispositivo</p>
      </div>
      <div className="space-y-2.5">
        {STORES.map((store) => {
          const isActive = store.id === currentId;
          return (
            <motion.button
              key={store.id}
              onClick={() => onSelect(store.id)}
              className={`w-full rounded-2xl border px-5 py-4 text-left transition-all active:scale-95 ${
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
        className="mt-5 w-full text-center text-sm text-muted-foreground underline underline-offset-2"
      >
        Annulla
      </button>
    </motion.div>
  </motion.div>
);
