import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/webidoo-logo.png";
import { getClientId } from "@/lib/clientId";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

interface KioskLockScreenProps {
  onStartQuiz: () => void;
  onDeactivate: () => void;
}

export const KioskLockScreen = ({ onStartQuiz, onDeactivate }: KioskLockScreenProps) => {
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [lockedSeconds, setLockedSeconds] = useState(0);
  const lockRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isLocked = lockedSeconds > 0;

  useEffect(() => {
    if (lockedSeconds <= 0) return;
    if (lockRef.current) clearInterval(lockRef.current);
    lockRef.current = setInterval(() => {
      setLockedSeconds((s) => {
        if (s <= 1) { clearInterval(lockRef.current!); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => { if (lockRef.current) clearInterval(lockRef.current); };
  }, [lockedSeconds]);

  const handleKey = useCallback(async (key: string) => {
    if (isLocked || verifying) return;
    if (key === "⌫") { setPin((p) => p.slice(0, -1)); return; }
    if (pin.length >= 4) return;

    const next = pin + key;
    setPin(next);
    if (next.length < 4) return;

    setVerifying(true);
    let result: { valid: boolean; locked_seconds: number } | null = null;

    try {
      const { data, error } = await supabase.functions.invoke("verify-pin", {
        body: { pin_input: next, client_id: getClientId(), user_agent: navigator.userAgent },
      });
      if (!error && data && typeof (data as Record<string, unknown>).valid === "boolean") {
        result = data as { valid: boolean; locked_seconds: number };
      }
    } catch { /* fallthrough to RPC */ }

    if (!result) {
      try {
        const { data: rpcData } = await supabase.rpc("verify_staff_pin", {
          pin_input: next, client_id: getClientId(), user_agent: navigator.userAgent,
        });
        result = rpcData as { valid: boolean; locked_seconds: number } | null;
      } catch { /* network failure */ }
    }

    setVerifying(false);

    if (result?.valid === true) {
      onDeactivate();
    } else {
      if (result?.locked_seconds && result.locked_seconds > 0) {
        setLockedSeconds(result.locked_seconds);
      }
      setShake(true);
      setTimeout(() => { setShake(false); setPin(""); }, 600);
    }
  }, [pin, isLocked, verifying, onDeactivate]);

  // ── PIN entry view ─────────────────────────────────────────────────
  if (showPin) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background">
        <motion.div
          className="mx-6 w-full max-w-xs rounded-3xl border border-border bg-card p-8 shadow-2xl"
          initial={{ scale: 0.9, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <div className="mb-6 text-center">
            <div className="mb-2 text-4xl">🔑</div>
            <h2 className="text-lg font-bold text-foreground">Disattiva Modalità Kiosk</h2>
            <p className="mt-1 text-xs text-muted-foreground">Inserisci il PIN staff per disattivare</p>
          </div>

          <AnimatePresence>
            {isLocked && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-center text-xs text-destructive"
              >
                Troppi tentativi. Riprova tra {lockedSeconds}s
              </motion.div>
            )}
          </AnimatePresence>

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

          {verifying && (
            <p className="mb-3 text-center text-xs text-muted-foreground animate-pulse">Verifica in corso…</p>
          )}

          <div className={`grid grid-cols-3 gap-3 ${isLocked || verifying ? "pointer-events-none opacity-40" : ""}`}>
            {KEYS.map((key, i) =>
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
              ),
            )}
          </div>

          <button
            onClick={() => { setShowPin(false); setPin(""); }}
            className="mt-5 w-full text-center text-sm text-muted-foreground underline underline-offset-2"
          >
            Annulla
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Main lock screen ─────────────────────────────────────────────────
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col items-center gap-6 px-8 text-center">
        <img src={logo} alt="Costanzo Annichini" className="h-12 object-contain" />

        <motion.div
          className="text-7xl"
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          🔒
        </motion.div>

        <div>
          <h1 className="text-2xl font-bold text-foreground">Schermo Bloccato</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Questo iPad è in modalità kiosk
          </p>
        </div>

        <motion.button
          onClick={onStartQuiz}
          className="mt-2 w-full max-w-xs rounded-2xl bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-lg active:opacity-90"
          whileTap={{ scale: 0.97 }}
        >
          ▶ Avvia il Quiz
        </motion.button>

        <button
          onClick={() => setShowPin(true)}
          className="text-sm text-muted-foreground underline underline-offset-2"
        >
          Disattiva Modalità Kiosk
        </button>
      </div>
    </motion.div>
  );
};
