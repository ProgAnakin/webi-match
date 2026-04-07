import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface MfaVerifyFormProps {
  onVerified: () => void;
  onCancel: () => void;
}

export const MfaVerifyForm = ({ onVerified, onCancel }: MfaVerifyFormProps) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    if (code.length !== 6) return;
    setLoading(true); setError("");
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const totp = factors?.totp?.[0];
    if (!totp) { setError("Nessun fattore 2FA trovato."); setLoading(false); return; }
    const { data: challenge, error: chalErr } = await supabase.auth.mfa.challenge({ factorId: totp.id });
    if (chalErr || !challenge) { setError("Errore. Riprova."); setLoading(false); return; }
    const { error: verErr } = await supabase.auth.mfa.verify({
      factorId: totp.id, challengeId: challenge.id, code,
    });
    setLoading(false);
    if (verErr) { setError("Codice non valido. Riprova."); setCode(""); }
    else onVerified();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-8">
      <motion.div className="w-full max-w-sm space-y-5 text-center"
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-5xl">🔐</div>
        <h1 className="text-2xl font-bold text-foreground">Verifica 2FA</h1>
        <p className="text-sm text-muted-foreground">Inserisci il codice a 6 cifre dall'app autenticatore</p>
        <input
          type="text" inputMode="numeric" maxLength={6} placeholder="000000"
          value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleVerify()}
          className="w-full rounded-2xl border border-border bg-card px-5 py-4 text-center text-2xl tracking-[0.4em] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <AnimatePresence>
          {error && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-sm text-destructive">{error}</motion.p>
          )}
        </AnimatePresence>
        <button onClick={handleVerify} disabled={loading || code.length !== 6}
          className="gradient-primary shadow-glow w-full rounded-2xl px-8 py-4 text-lg font-bold text-primary-foreground active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? "Verifica…" : "Conferma"}
        </button>
        <button onClick={onCancel} className="text-sm text-muted-foreground underline underline-offset-2">
          Annulla e torna al login
        </button>
      </motion.div>
    </div>
  );
};
