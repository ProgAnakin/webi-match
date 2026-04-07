import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { STORES, setStoredStoreId, getStoredStoreId } from "@/data/stores";
import { supabase } from "@/integrations/supabase/client";

// PIN validation is server-side via Supabase RPC (verify_staff_pin).
// Lockout + attempt logging are also managed server-side.

const KEYS = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

// Persistent device ID — used server-side to track lockout per device.
function getClientId(): string {
  const key = "wb_client_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

type Step = "pin" | "store";

interface AdminPinOverlayProps {
  onClose: () => void;
}

const AdminPinOverlay = ({ onClose }: AdminPinOverlayProps) => {
  const [step, setStep] = useState<Step>("pin");
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [verifying, setVerifying] = useState(false);
  // Lockout managed by server response
  const [lockedSeconds, setLockedSeconds] = useState(0);
  const [currentStoreId, setCurrentStoreId] = useState<string | null>(getStoredStoreId);
  const [savedStoreId, setSavedStoreId] = useState<string | null>(null); // for visual confirmation
  const navigate = useNavigate();
  const lockCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isLocked = lockedSeconds > 0;

  // Client-side countdown driven by server-side locked_seconds
  useEffect(() => {
    if (lockedSeconds <= 0) return;
    if (lockCountdownRef.current) clearInterval(lockCountdownRef.current);
    lockCountdownRef.current = setInterval(() => {
      setLockedSeconds((s) => {
        if (s <= 1) {
          clearInterval(lockCountdownRef.current!);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (lockCountdownRef.current) clearInterval(lockCountdownRef.current); };
  }, [lockedSeconds]);

  const handleKey = useCallback(async (key: string) => {
    if (isLocked || verifying) return;

    if (key === "⌫") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (pin.length >= 4) return;

    const next = pin + key;
    setPin(next);

    if (next.length === 4) {
      setVerifying(true);
      const { data, error } = await supabase.rpc("verify_staff_pin", {
        pin_input: next,
        client_id: getClientId(),
      });
      setVerifying(false);

      // data is JSON: { valid: boolean, locked_seconds: number }
      const result = data as { valid: boolean; locked_seconds: number } | null;

      if (!error && result?.valid === true) {
        setTimeout(() => setStep("store"), 300);
      } else {
        // If server returned a lockout, apply it
        if (result?.locked_seconds && result.locked_seconds > 0) {
          setLockedSeconds(result.locked_seconds);
        }
        setShake(true);
        setTimeout(() => {
          setShake(false);
          setPin("");
        }, 600);
      }
    }
  }, [pin, isLocked, verifying]);

  const handleSelectStore = (storeId: string) => {
    setStoredStoreId(storeId);
    setCurrentStoreId(storeId);
    setSavedStoreId(storeId); // triggers visual confirmation
    // Brief flash, then clear
    setTimeout(() => setSavedStoreId(null), 1500);
  };

  // ─── Store selection step ────────────────────────────────────────────────────
  if (step === "store") {
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
          <div className="mb-5 text-center">
            <div className="mb-2 text-4xl">📍</div>
            <h2 className="text-lg font-bold text-foreground">Seleziona la Sede</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Scegli la sede in cui si trova questo iPad
            </p>
          </div>

          {/* Store list */}
          <div className="space-y-2">
            {STORES.map((store) => {
              const isActive = store.id === currentStoreId;
              const justSaved = store.id === savedStoreId;
              return (
                <motion.button
                  key={store.id}
                  onClick={() => handleSelectStore(store.id)}
                  className={`w-full rounded-2xl border px-5 py-3.5 text-left transition-all active:scale-95 ${
                    isActive
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-secondary text-foreground hover:border-primary/40"
                  }`}
                  whileTap={{ scale: 0.97 }}
                  animate={justSaved ? { scale: [1, 1.03, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{store.name}</span>
                    <AnimatePresence>
                      {isActive && (
                        <motion.span
                          key="check"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 20 }}
                          className="text-xs font-bold text-primary"
                        >
                          ✓
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="mt-5 space-y-2.5">
            <motion.button
              onClick={() => { onClose(); }}
              disabled={!currentStoreId}
              className="gradient-primary shadow-glow w-full rounded-2xl px-6 py-3.5 text-sm font-bold text-primary-foreground active:scale-95 disabled:opacity-40"
              whileTap={{ scale: 0.97 }}
            >
              ✓ Salva sede e torna al quiz
            </motion.button>
            <motion.button
              onClick={() => navigate("/stats")}
              className="w-full rounded-2xl border border-border bg-secondary px-6 py-3.5 text-sm font-semibold text-foreground active:scale-95"
              whileTap={{ scale: 0.97 }}
            >
              📊 Vai ad Analytics / Manager
            </motion.button>
          </div>
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
              Troppi tentativi. Riprova tra <strong>{lockedSeconds}s</strong>.
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

        {/* Verifying indicator */}
        {verifying && (
          <p className="mb-3 text-center text-xs text-muted-foreground animate-pulse">Verifica in corso…</p>
        )}

        {/* Numeric keypad */}
        <div className={`grid grid-cols-3 gap-3 ${isLocked || verifying ? "pointer-events-none opacity-40" : ""}`}>
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
