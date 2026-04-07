import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type MfaStep = "loading" | "qr" | "verify" | "done" | "already" | "error";

interface MfaSetupModalProps {
  onClose: () => void;
  onEnabled: () => void;
}

export const MfaSetupModal = ({ onClose, onEnabled }: MfaSetupModalProps) => {
  const [step, setStep] = useState<MfaStep>("loading");
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const init = async () => {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const verified = factors?.totp?.filter((f) => f.status === "verified") ?? [];
      if (verified.length > 0) { setStep("already"); return; }
      const unverified = factors?.totp?.filter((f) => f.status !== "verified") ?? [];
      for (const f of unverified) await supabase.auth.mfa.unenroll({ factorId: f.id });
      const { data, error: enrollErr } = await supabase.auth.mfa.enroll({
        factorType: "totp", friendlyName: "Webidoo Manager",
      });
      if (enrollErr || !data) { setStep("error"); return; }
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setStep("qr");
    };
    init();
  }, []);

  const handleDisable = async () => {
    const { data: factors } = await supabase.auth.mfa.listFactors();
    for (const f of factors?.totp ?? []) await supabase.auth.mfa.unenroll({ factorId: f.id });
    onClose();
  };

  const handleConfirm = async () => {
    if (code.length !== 6) return;
    setLoading(true); setError("");
    const { error: verErr } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    setLoading(false);
    if (verErr) { setError("Codice non valido. Riprova."); setCode(""); }
    else { setStep("done"); }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="w-full max-w-sm rounded-3xl border border-border bg-card p-8 shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-foreground">🔐 Autenticazione 2FA</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === "loading" && (
          <p className="text-center text-muted-foreground py-8">Preparazione…</p>
        )}

        {step === "error" && (
          <div className="space-y-4 text-center">
            <p className="text-sm text-destructive">Errore durante la configurazione. Riprova.</p>
            <button onClick={onClose} className="text-sm text-primary underline">Chiudi</button>
          </div>
        )}

        {step === "already" && (
          <div className="space-y-4 text-center">
            <div className="text-4xl">✅</div>
            <p className="text-sm text-foreground font-medium">2FA già attivo sul tuo account.</p>
            <p className="text-xs text-muted-foreground">Usa l'app autenticatore per accedere.</p>
            <button onClick={handleDisable}
              className="w-full rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Disabilita 2FA
            </button>
            <button onClick={onClose} className="text-sm text-muted-foreground underline">Annulla</button>
          </div>
        )}

        {step === "qr" && (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground text-center">
              Scansiona il QR code con <strong className="text-foreground">Google Authenticator</strong>,{" "}
              <strong className="text-foreground">Authy</strong> o simile.
            </p>
            {qrCode && (
              <div className="flex justify-center">
                <img src={qrCode} alt="QR Code 2FA" className="h-48 w-48 rounded-xl border border-border" />
              </div>
            )}
            <div className="rounded-xl bg-muted px-3 py-2 text-center">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] text-muted-foreground">Codice manuale</p>
                <button
                  onClick={() => setShowSecret((v) => !v)}
                  className="text-[10px] text-primary underline underline-offset-2"
                >
                  {showSecret ? "Nascondi" : "Mostra"}
                </button>
              </div>
              {showSecret
                ? <p className="font-mono text-xs text-foreground break-all">{secret}</p>
                : <p className="font-mono text-xs text-muted-foreground tracking-widest">••••••••••••••••••••••••••••••••</p>
              }
            </div>
            <button onClick={() => setStep("verify")}
              className="gradient-primary shadow-glow w-full rounded-2xl px-8 py-3 text-sm font-bold text-primary-foreground active:scale-95">
              Ho scansionato → Continua
            </button>
          </div>
        )}

        {step === "verify" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Inserisci il codice a 6 cifre dall'app per confermare.
            </p>
            <input type="text" inputMode="numeric" maxLength={6} placeholder="000000"
              value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
              className="w-full rounded-2xl border border-border bg-background px-5 py-4 text-center text-2xl tracking-[0.4em] text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            <AnimatePresence>
              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-sm text-destructive text-center">{error}</motion.p>
              )}
            </AnimatePresence>
            <button onClick={handleConfirm} disabled={loading || code.length !== 6}
              className="gradient-primary shadow-glow w-full rounded-2xl px-8 py-3 text-sm font-bold text-primary-foreground active:scale-95 disabled:opacity-50">
              {loading ? "Verifica…" : "Attiva 2FA"}
            </button>
            <button onClick={() => setStep("qr")} className="text-sm text-muted-foreground underline w-full text-center">
              ← Torna al QR code
            </button>
          </div>
        )}

        {step === "done" && (
          <div className="space-y-4 text-center">
            <div className="text-5xl">🎉</div>
            <p className="text-lg font-bold text-foreground">2FA attivato!</p>
            <p className="text-sm text-muted-foreground">
              Al prossimo accesso ti verrà chiesto il codice dall'app autenticatore.
            </p>
            <button onClick={() => { onEnabled(); onClose(); }}
              className="gradient-primary shadow-glow w-full rounded-2xl px-8 py-3 text-sm font-bold text-primary-foreground active:scale-95">
              Perfetto!
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
