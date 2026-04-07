import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ManagerDashboard } from "@/components/manager/ManagerDashboard";

// ─── Manager — auth guard ─────────────────────────────────────────────────────
// Verifies the Supabase session; redirects to /stats (login) if unauthenticated.

const Manager = () => {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setAuthed(true);
      } else {
        navigate("/stats", { replace: true });
      }
      setChecking(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/stats", { replace: true });
      else setAuthed(true);
    });

    return () => listener.subscription.unsubscribe();
  }, [navigate]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Verifica sessione…</p>
      </div>
    );
  }

  if (!authed) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div key="manager" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <ManagerDashboard onLogout={() => navigate("/stats", { replace: true })} />
      </motion.div>
    </AnimatePresence>
  );
};

export default Manager;
