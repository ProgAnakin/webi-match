import { AnimatePresence, motion } from "framer-motion";

export interface BulkConfirmIntent {
  enable: boolean;
  count: number;
}

interface BulkConfirmBannerProps {
  intent: BulkConfirmIntent | null;
  onConfirm: (enable: boolean) => void;
  onCancel: () => void;
}

export const BulkConfirmBanner = ({ intent, onConfirm, onCancel }: BulkConfirmBannerProps) => (
  <AnimatePresence>
    {intent && (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm"
      >
        <p className="text-amber-300 font-semibold mb-2">
          You are about to {intent.enable ? "activate" : "deactivate"} {intent.count} products. Confirm?
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => onConfirm(intent.enable)}
            className="rounded-xl border border-amber-500/40 bg-amber-500/20 px-4 py-1.5 text-xs font-semibold text-amber-300 active:scale-95"
          >
            Confirm
          </button>
          <button
            onClick={onCancel}
            className="rounded-xl border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground active:scale-95"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);
