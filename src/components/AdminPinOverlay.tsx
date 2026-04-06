import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { STORES, setStoredStoreId, getStoredStoreId } from "@/data/stores";

// PIN is loaded from the VITE_STAFF_PIN environment variable set in Vercel.
// To rotate it: change the env var in Vercel → redeploy. Never hardcode it here.
const STAFF_PIN = import.meta.env.VITE_STAFF_PIN as string | undefined;

const MAX_ATTEMPTS = 3;
const LOCKOUT_MS = 2 * 60 * 1000; // 2 minutes

const KEYS = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

type Step = "pin" | "store";

interface AdminPinOverlayProps {
  onClose: () => void;
}

const AdminPinOverlay = ({ onClose }: AdminPinOverlayProps) => {
  const [step, setStep] = useState<Step>("pin");
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [currentStoreId, setCurrentStoreId] = useState<string | null>(getStoredStoreId);
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil;

  // Countdown ticker while locked
  useEffect(() => {
    if (!lockedUntil) return;
    const tick = () => {
      const left = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (left <= 0) {
        setLockedUntil(null);
        setSecondsLeft(0);
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        setSecondsLeft(left);
      }
    };
    tick();
    timerRef.current = setInterval(tick, 500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [lockedUntil]);

  const handleKey = useCallback((key: string) => {
    if (isLocked) return;

    if (key === "⌫") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (pin.length >= 4) return;

    const next = pin + key;
    setPin(next);

    if (next.length === 4) {
      if (STAFF_PIN && next === STAFF_PIN) {
        setAttempts(0);
        // After PIN: go to store selector
        setTimeout(() => setStep("store"), 300);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setShake(true);
        setTimeout(() => {
          setShake(false);
          setPin("");
          if (newAttempts >= MAX_ATTEMPTS) {
            setLockedUntil(Date.now() + LOCKOUT_MS);
            setAttempts(0);
          }
        }, 600);
      }
    }
  }, [pin, attempts, isLocked]);

  const handleSelectStore = (storeId: string) => {
    setStoredStoreId(storeId);
    setCurrentStoreId(storeId);
    navigate("/stats");
  };

  const handleContinueWithoutChanging = () => {
    navigate("/stats");
  };

  // ─── Store selection step ────────────────────────────────────────────────────
  if (step === "store") {
    const current = STORES.find((s) => s.id === currentStoreId);
    return (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="mx-6 w-full max-w-sm rounded-3xl border border-border bg-card p-8 shadow-2xl"
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <div className="mb-6 text-center">
            <div className="mb-2 text-4xl">📍</div>
            <h2 className="text-lg font-bold text-foreground">Seleziona la Sede</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Scegli la sede in cui si trova questo iPad
            </p>
          </div>

          <div className="space-y-2.5">
            {STORES.map((store) => {
              const isActive = store.id === currentStoreId;
              return (
                <motion.button
                  key={store.id}
                  onClick={() => handleSelectStore(store.id)}
                  className={`w-full rounded-2xl border px-5 py-4 text-left transition-all active:scale-95 ${
                    isActive
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-secondary text-foreground hover:border-primary/40"
                  }`}
                  whileTap={{ scale: 0.97 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{store.name}</span>
                    {isActive && (
                      <span className="text-xs font-bold text-primary">✓ Attuale</span>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {currentStoreId && (
            <button
              onClick={handleContinueWithoutChanging}
              className="mt-5 w-full text-center text-sm text-muted-foreground underline underline-offset-2"
            >
              Continua senza cambiare
            </button>
          )}
        </motion.div>
      </motion.div>
    );
  }

  // ─── PIN step ────────────────────────────────────────────────────────────────
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

        {/* Locked banner */}
        <AnimatePresence>
          {isLocked && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-center text-xs text-destructive"
            >
              Troppi tentativi. Riprova tra <strong>{secondsLeft}s</strong>.
            </motion.div>
          )}
        </AnimatePresence>

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
        <div className={`grid grid-cols-3 gap-3 ${isLocked ? "pointer-events-none opacity-40" : ""}`}>
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
