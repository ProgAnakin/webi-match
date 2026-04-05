import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BarChart2, LogOut, Power, PowerOff, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { products } from "@/data/products";

// ─── Types ────────────────────────────────────────────────────────────────────
/** product_id → active boolean, loaded from Supabase */
type SettingsMap = Record<string, boolean>;

// Logout automático após 30 minutos de inatividade para proteger sessões abertas em kiosks
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const IDLE_EVENTS = ["mousedown", "touchstart", "keydown", "scroll"] as const;

function useIdleLogout(onLogout: () => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const reset = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        await supabase.auth.signOut();
        onLogout();
      }, IDLE_TIMEOUT_MS);
    };

    reset(); // arm on mount
    IDLE_EVENTS.forEach((ev) => window.addEventListener(ev, reset, { passive: true }));
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      IDLE_EVENTS.forEach((ev) => window.removeEventListener(ev, reset));
    };
  }, [onLogout]);
}

// ─── Manager Dashboard ────────────────────────────────────────────────────────
const ManagerDashboard = ({ onLogout }: { onLogout: () => void }) => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useIdleLogout(onLogout);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("product_settings")
      .select("product_id, active");

    if (data) {
      const map: SettingsMap = {};
      data.forEach((row) => { map[row.product_id] = row.active; });
      setSettings(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const toggleProduct = async (productId: string) => {
    const current = settings[productId] ?? true;
    const next = !current;

    // Optimistic update — immediate visual feedback
    setSettings((prev) => ({ ...prev, [productId]: next }));
    setSavingId(productId);
    setSaveError(null);

    const { error } = await supabase
      .from("product_settings")
      .upsert({ product_id: productId, active: next, updated_at: new Date().toISOString() });

    if (error) {
      setSavingId(null);
      // Rollback on failure
      setSettings((prev) => ({ ...prev, [productId]: current }));
      setSaveError("Errore nel salvataggio. Verifica la connessione e riprova.");
      return;
    }

    // Write audit log entry (fire-and-forget — never blocks the UI)
    supabase.auth.getUser().then(({ data }) => {
      supabase.from("manager_audit_log").insert({
        user_id: data.user?.id ?? null,
        user_email: data.user?.email ?? null,
        product_id: productId,
        new_active: next,
      });
    });

    setSavingId(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  // Sort: active first, then paused
  const sortedProducts = [...products].sort((a, b) => {
    const aOn = settings[a.id] !== false;
    const bOn = settings[b.id] !== false;
    if (aOn === bOn) return 0;
    return aOn ? -1 : 1;
  });

  const activeCount = products.filter((p) => settings[p.id] !== false).length;

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">

        {/* Header */}
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">📦 Catalogo</h1>
            <p className="text-xs text-muted-foreground">
              {loading ? "Caricamento…" : `${activeCount} di ${products.length} prodotti attivi nel quiz`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchSettings}
              className="flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground active:scale-95"
            >
              <RotateCcw className="h-3 w-3" />
              Aggiorna
            </button>
            <button
              onClick={() => navigate("/stats")}
              className="flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground active:scale-95"
            >
              <BarChart2 className="h-3 w-3" />
              Analytics
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive active:scale-95"
            >
              <LogOut className="h-3 w-3" />
              Esci
            </button>
          </div>
        </motion.div>

        {/* Error banner */}
        <AnimatePresence>
          {saveError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {saveError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info banner */}
        <motion.div
          className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-muted-foreground leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          💡 I prodotti <strong className="text-foreground">In pausa</strong> vengono esclusi dal
          match del quiz — utile per stock esaurito o partnership terminata. Il cambiamento è
          immediato: la prossima sessione del quiz userà già la lista aggiornata.
        </motion.div>

        {/* Product list */}
        {loading ? (
          <div className="py-20 text-center text-muted-foreground">Caricamento prodotti…</div>
        ) : (
          <div className="space-y-3">
            {sortedProducts.map((product, i) => {
              const isActive = settings[product.id] !== false;
              const isSaving = savingId === product.id;

              return (
                <motion.div
                  key={product.id}
                  className={`rounded-2xl border bg-card shadow-card transition-all duration-300 ${
                    isActive ? "border-border" : "border-border/30"
                  }`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: isActive ? 1 : 0.55, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <div className="flex items-start gap-4 p-5">
                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      {/* Status badge */}
                      <span
                        className={`mb-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isActive
                            ? "bg-green-500/15 text-green-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isActive ? "● ATTIVO" : "● IN PAUSA"}
                      </span>

                      <h3 className="text-sm font-bold leading-snug text-foreground">
                        {product.name}
                      </h3>
                      <p className="mt-0.5 text-sm font-semibold text-primary">{product.price}</p>

                      {/* Tags */}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {product.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-muted px-2 py-0.5 text-[10px] capitalize text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Toggle button */}
                    <motion.button
                      onClick={() => !isSaving && toggleProduct(product.id)}
                      disabled={isSaving}
                      className={`shrink-0 flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${
                        isActive
                          ? "border-destructive/30 bg-destructive/10 text-destructive active:bg-destructive/20"
                          : "border-green-500/30 bg-green-500/10 text-green-400 active:bg-green-500/20"
                      }`}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isSaving ? (
                        <span className="animate-pulse">…</span>
                      ) : isActive ? (
                        <><PowerOff className="h-3 w-3" /> Disattiva</>
                      ) : (
                        <><Power className="h-3 w-3" /> Riattiva</>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <p className="pb-4 text-center text-xs text-muted-foreground">
          Webi Match · Gestione Catalogo · Webidoo
        </p>
      </div>
    </div>
  );
};

// ─── Manager page (auth guard) ────────────────────────────────────────────────
const Manager = () => {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // If not authenticated, send to /stats which has the full login form
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

  if (!authed) return null; // redirect in progress

  return (
    <AnimatePresence mode="wait">
      <motion.div key="manager" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <ManagerDashboard onLogout={() => navigate("/stats", { replace: true })} />
      </motion.div>
    </AnimatePresence>
  );
};

export default Manager;
