import { AnimatePresence, motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { STORES } from "@/data/stores";

interface SendToStoreModalProps {
  open: boolean;
  sourceStoreId: string;
  selectionCount: number;
  sending: boolean;
  onSend: (targetStoreId: string) => void;
  onClose: () => void;
}

export const SendToStoreModal = ({
  open,
  sourceStoreId,
  selectionCount,
  sending,
  onSend,
  onClose,
}: SendToStoreModalProps) => (
  <AnimatePresence>
    {open && (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-6"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={() => !sending && onClose()}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl"
          initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-1 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-sky-400" />
            <p className="text-sm font-bold text-foreground">Send to another store</p>
          </div>
          <p className="mb-4 text-xs text-muted-foreground leading-relaxed">
            Copies {selectionCount} product{selectionCount > 1 ? "s" : ""} into the chosen
            store's catalog (set as active), carrying this store's price, image, video
            and discount. Pick the destination:
          </p>
          <div className="space-y-2">
            {STORES.filter((s) => s.id !== sourceStoreId).map((s) => (
              <button
                key={s.id}
                disabled={sending}
                onClick={() => onSend(s.id)}
                className="flex w-full items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm font-semibold text-foreground hover:border-sky-500/40 active:scale-95 disabled:opacity-50"
              >
                <span>{s.name}</span>
                <span className="text-xs text-sky-400">{sending ? "…" : "Send →"}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => !sending && onClose()}
            disabled={sending}
            className="mt-4 w-full rounded-xl border border-border bg-card py-2.5 text-sm font-semibold text-muted-foreground active:scale-95 disabled:opacity-50"
          >
            Cancel
          </button>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
