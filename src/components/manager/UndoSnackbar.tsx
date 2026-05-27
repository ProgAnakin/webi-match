import { AnimatePresence, motion } from "framer-motion";
import { Undo2 } from "lucide-react";

interface UndoSnackbarProps {
  visible: boolean;
  countdown: number;
  onUndo: () => void;
}

export const UndoSnackbar = ({ visible, countdown, onUndo }: UndoSnackbarProps) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-border bg-card px-5 py-3.5 shadow-2xl"
        initial={{ opacity: 0, y: 24, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.95 }}
      >
        <span className="text-sm text-foreground">Change saved.</span>
        <button
          onClick={onUndo}
          className="flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary active:scale-95"
        >
          <Undo2 className="h-3.5 w-3.5" /> Undo ({countdown}s)
        </button>
      </motion.div>
    )}
  </AnimatePresence>
);
