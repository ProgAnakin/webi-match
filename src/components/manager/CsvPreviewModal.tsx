import { AnimatePresence, motion } from "framer-motion";
import type { Product } from "@/data/products";

export interface CsvPriceUpdate {
  productId: string;
  newPrice: string;
}

interface CsvPreviewModalProps {
  open: boolean;
  preview: CsvPriceUpdate[];
  catalogProducts: Product[];
  onApply: () => void;
  onClose: () => void;
}

export const CsvPreviewModal = ({
  open,
  preview,
  catalogProducts,
  onApply,
  onClose,
}: CsvPreviewModalProps) => (
  <AnimatePresence>
    {open && (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl max-h-[70vh] overflow-y-auto"
          initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-lg font-bold text-foreground mb-4">Confirm price update</h2>
          <div className="space-y-2 mb-6">
            {preview.map(({ productId, newPrice }) => {
              const prod = catalogProducts.find((p) => p.id === productId);
              return (
                <div key={productId} className="text-xs p-2 rounded-lg border border-border bg-background/40">
                  <p className="font-semibold text-foreground">{prod?.name ?? productId}</p>
                  <p className="text-muted-foreground">
                    {prod?.price ?? "—"} →{" "}
                    <span className="text-primary font-semibold">{newPrice}</span>
                  </p>
                </div>
              );
            })}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-border bg-muted px-4 py-2 text-sm text-muted-foreground active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={onApply}
              className="flex-1 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary active:scale-95"
            >
              Apply {preview.length}
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
