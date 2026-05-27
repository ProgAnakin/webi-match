import { AnimatePresence, motion } from "framer-motion";
import { Download } from "lucide-react";
import { getStoreById } from "@/data/stores";

interface GdprExportConfirmProps {
  open: boolean;
  sessionCount: number;
  filterStore: string | null;
  dateFrom: string;
  dateTo: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const GdprExportConfirm = ({
  open,
  sessionCount,
  filterStore,
  dateFrom,
  dateTo,
  onConfirm,
  onCancel,
}: GdprExportConfirmProps) => (
  <AnimatePresence>
    {open && (
      <motion.div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onCancel()}
      >
        <motion.div
          className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl"
          initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
        >
          <p className="text-sm font-bold text-foreground mb-2">⚠️ Personal data — GDPR</p>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            The file contains customer <strong className="text-foreground">email addresses</strong>.
            Handle this data in compliance with GDPR: do not share the file, do not keep it longer than necessary,
            and delete it after use.
          </p>
          <div className="mb-5 rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <strong className="text-foreground">{sessionCount}</strong> sessions
            {filterStore && <> · <span className="text-primary">{getStoreById(filterStore)?.shortName ?? filterStore}</span></>}
            {dateFrom && <> · from {dateFrom}</>}
            {dateTo && <> to {dateTo}</>}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 rounded-xl border border-border bg-muted px-4 py-2.5 text-sm text-muted-foreground active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary active:scale-95"
            >
              <Download className="inline h-3.5 w-3.5 mr-1.5" />
              Download CSV
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
