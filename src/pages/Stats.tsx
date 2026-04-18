import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LoginForm } from "@/components/stats/LoginForm";
import { MfaVerifyForm } from "@/components/stats/MfaVerifyForm";
import { Dashboard } from "@/components/stats/Dashboard";
import type { AuthStep } from "@/components/stats/types";

// ─── Stats — auth state machine ───────────────────────────────────────────────
// Renders LoginForm → MfaVerifyForm → Dashboard based on the current auth step.

const AdminSpinner = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <div className="text-muted-foreground text-sm">Loading…</div>
    </div>
  </div>
);

const Stats = () => {
  const navigate = useNavigate();
  const [authStep, setAuthStep] = useState<AuthStep>("login");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data, error }) => {
      if (error) {
        console.error("[webi-match] getSession failed:", error);
        setAuthStep("login");
        setChecking(false);
        return;
      }
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
    }).catch((err) => {
      console.error("[webi-match] auth check threw:", err);
      setAuthStep("login");
      setChecking(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) setAuthStep("login");
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (checking) return <AdminSpinner />;

  return (
    <>
      <button
        onClick={() => navigate("/")}
        className="fixed left-4 top-4 z-50 flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground/60 transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Home
      </button>
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
    </>
  );
};

export default Stats;
