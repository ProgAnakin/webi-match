import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { LoginForm } from "@/components/stats/LoginForm";
import { MfaVerifyForm } from "@/components/stats/MfaVerifyForm";
import { Dashboard } from "@/components/stats/Dashboard";
import type { AuthStep } from "@/components/stats/types";

// ─── Stats — auth state machine ───────────────────────────────────────────────
// Renders LoginForm → MfaVerifyForm → Dashboard based on the current auth step.

const Stats = () => {
  const [authStep, setAuthStep] = useState<AuthStep>("login");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aal?.nextLevel === "aal2" && aal?.currentLevel !== "aal2") {
          setAuthStep("mfa");
        } else {
          setAuthStep("dashboard");
        }
      } else {
        setAuthStep("login");
      }
      setChecking(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) setAuthStep("login");
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Verifica sessione…</p>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {authStep === "login" && (
        <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <LoginForm
            onLoginSuccess={() => setAuthStep("dashboard")}
            onMfaRequired={() => setAuthStep("mfa")}
          />
        </motion.div>
      )}
      {authStep === "mfa" && (
        <motion.div key="mfa" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <MfaVerifyForm
            onVerified={() => setAuthStep("dashboard")}
            onCancel={async () => {
              await supabase.auth.signOut();
              setAuthStep("login");
            }}
          />
        </motion.div>
      )}
      {authStep === "dashboard" && (
        <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Dashboard onLogout={() => setAuthStep("login")} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Stats;
