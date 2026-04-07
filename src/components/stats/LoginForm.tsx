import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface LoginFormProps {
  onLoginSuccess: () => void;
  onMfaRequired: () => void;
}

// Rate limiting is enforced server-side via check_login_rate_limit RPC.
export const LoginForm = ({ onLoginSuccess, onMfaRequired }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lockedSeconds, setLockedSeconds] = useState(0);
  const lockCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isLocked = lockedSeconds > 0;

  useEffect(() => {
    if (lockedSeconds <= 0) return;
    if (lockCountdownRef.current) clearInterval(lockCountdownRef.current);
    lockCountdownRef.current = setInterval(() => {
      setLockedSeconds((s) => {
        if (s <= 1) { clearInterval(lockCountdownRef.current!); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => { if (lockCountdownRef.current) clearInterval(lockCountdownRef.current); };
  }, [lockedSeconds]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim() || isLocked) return;
    setLoading(true); setError("");

    const { data: limitData } = await supabase.rpc("check_login_rate_limit", {
      p_email: email.trim().toLowerCase(),
    });
    const limit = limitData as { locked: boolean; locked_seconds: number } | null;
    if (limit?.locked) {
      setLockedSeconds(limit.locked_seconds);
      setLoading(false);
      setError("Troppi tentativi. Riprova tra qualche minuto.");
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(), password,
    });

    supabase.rpc("record_login_attempt", {
      p_email: email.trim().toLowerCase(),
      p_success: !authError,
    });

    setLoading(false);
    if (authError) {
      setError("Credenziali non valide.");
    } else {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.nextLevel === "aal2" && aal?.currentLevel !== "aal2") {
        onMfaRequired();
      } else {
        onLoginSuccess();
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-8">
      <motion.div className="w-full max-w-sm space-y-5 text-center"
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-5xl">📊</div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Analytics</h1>
        <p className="text-sm text-muted-foreground">Accesso riservato a Webidoo</p>
        <div className="space-y-3 text-left">
          <input type="email" placeholder="Email" value={email} autoComplete="email"
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full rounded-2xl border border-border bg-card px-5 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          <input type="password" placeholder="Password" value={password} autoComplete="current-password"
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full rounded-2xl border border-border bg-card px-5 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <AnimatePresence>
          {error && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-sm text-destructive">{error}</motion.p>
          )}
        </AnimatePresence>
        <button onClick={handleLogin}
          disabled={loading || isLocked || !email.trim() || !password.trim()}
          className="gradient-primary shadow-glow w-full rounded-2xl px-8 py-4 text-lg font-bold text-primary-foreground active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? "Accesso in corso…" : isLocked ? `Bloccato — ${lockedSeconds}s` : "Accedi"}
        </button>
      </motion.div>
    </div>
  );
};
