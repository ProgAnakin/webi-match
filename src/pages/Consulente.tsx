import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LoginForm } from "@/components/stats/LoginForm";
import { MfaVerifyForm } from "@/components/stats/MfaVerifyForm";
import { ConsulenteDashboard } from "@/components/consulente/ConsulenteDashboard";

// ─── Consulente — consultant training zone ────────────────────────────────────
// Auth state machine: login → (mfa) → role check → dashboard.
// Access is granted to any store_roles row — consulente, consulente_responsabile
// or manager. The training content itself is read-only here; managers author it
// from /manager.

type Step = "login" | "mfa" | "checking" | "dashboard" | "denied";

const ALLOWED_ROLES = ["consulente", "consulente_responsabile", "manager"];

const AdminSpinner = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
      <div className="text-muted-foreground text-sm">Loading…</div>
    </div>
  </div>
);

const Consulente = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("checking");

  // Verifies the signed-in user holds an allowed store_roles role.
  const resolveRole = async () => {
    const { data, error } = await supabase
      .from("store_roles")
      .select("role")
      .maybeSingle();
    if (error || !data || !ALLOWED_ROLES.includes(data.role)) {
      setStep("denied");
      return;
    }
    setStep("dashboard");
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data, error }) => {
      if (error) {
        console.error("[webi-match] getSession failed:", error);
        setStep("login");
        return;
      }
      if (!data.session) {
        setStep("login");
        return;
      }
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.nextLevel === "aal2" && aal?.currentLevel !== "aal2") {
        setStep("mfa");
      } else {
        await resolveRole();
      }
    }).catch((err) => {
      console.error("[webi-match] auth check threw:", err);
      setStep("login");
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") setStep("login");
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (step === "checking") return <AdminSpinner />;

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
        {step === "login" && (
          <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LoginForm
              icon="🎓"
              title="Consultant Training"
              subtitle="Sign in with your consultant account"
              onLoginSuccess={() => { setStep("checking"); resolveRole(); }}
              onMfaRequired={() => setStep("mfa")}
            />
          </motion.div>
        )}

        {step === "mfa" && (
          <motion.div key="mfa" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <MfaVerifyForm
              onVerified={() => { setStep("checking"); resolveRole(); }}
              onCancel={async () => {
                await supabase.auth.signOut();
                setStep("login");
              }}
            />
          </motion.div>
        )}

        {step === "denied" && (
          <motion.div
            key="denied"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-8 text-center"
          >
            <div className="text-5xl">🚫</div>
            <h1 className="text-xl font-bold text-foreground">No access</h1>
            <p className="max-w-sm text-sm text-muted-foreground">
              This account is not registered as a consultant. Ask a manager to assign you a
              role from the Roles tab.
            </p>
            <button
              onClick={async () => { await supabase.auth.signOut(); setStep("login"); }}
              className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground active:scale-95"
            >
              Sign out
            </button>
          </motion.div>
        )}

        {step === "dashboard" && (
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ConsulenteDashboard
              onLogout={async () => { await supabase.auth.signOut(); setStep("login"); }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Consulente;
