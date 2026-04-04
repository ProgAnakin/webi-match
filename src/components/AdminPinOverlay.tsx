import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

// Change this to update the staff PIN
const STAFF_PIN = "0123";

const KEYS = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

interface AdminPinOverlayProps {
  onClose: () => void;
}

const AdminPinOverlay = ({ onClose }: AdminPinOverlayProps) => {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const navigate = useNavigate();

  const handleKey = useCallback((key: string) => {
    if (key === "⌫") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (pin.length >= 4) return;

    const next = pin + key;
    setPin(next);

    if (next.length === 4) {
      if (next === STAFF_PIN) {
        // Small delay so the last dot fills before navigating
        setTimeout(() => navigate("/stats"), 300);
      } else {
        // Wrong PIN — shake and clear
        setShake(true);
        setTimeout(() => { setShake(false); setPin(""); }, 600);
      }
    }
  }, [pin, navigate]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="mx-6 w-full max-w-xs rounded-3xl border border-border bg-card p-8 shadow-2xl"
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mb-2 text-4xl">🔐</div>
          <h2 className="text-lg font-bold text-foreground">Accesso Staff</h2>
          <p className="mt-1 text-xs text-muted-foreground">Inserisci il PIN per accedere</p>
        </div>

        {/* PIN dots */}
        <motion.div
          className="mb-8 flex justify-center gap-4"
          animate={shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="h-4 w-4 rounded-full border-2 border-primary"
              animate={{
                backgroundColor: i < pin.length ? "hsl(var(--primary))" : "transparent",
                scale: i === pin.length - 1 && pin.length > 0 ? [1, 1.3, 1] : 1,
              }}
              transition={{ duration: 0.15 }}
            />
          ))}
        </motion.div>

        {/* Numeric keypad */}
        <div className="grid grid-cols-3 gap-3">
          {KEYS.map((key, i) => (
            key === "" ? (
              <div key={i} />
            ) : (
              <motion.button
                key={i}
                onClick={() => handleKey(key)}
                className={`flex h-14 items-center justify-center rounded-2xl text-xl font-semibold transition-colors ${
                  key === "⌫"
                    ? "bg-muted text-muted-foreground"
                    : "bg-secondary text-foreground hover:bg-primary/20 active:bg-primary/30"
                }`}
                whileTap={{ scale: 0.92 }}
              >
                {key}
              </motion.button>
            )
          ))}
        </div>

        {/* Cancel */}
        <button
          onClick={onClose}
          className="mt-5 w-full text-center text-sm text-muted-foreground underline underline-offset-2"
        >
          Annulla
        </button>
      </motion.div>
    </motion.div>
  );
};

export default AdminPinOverlay;
