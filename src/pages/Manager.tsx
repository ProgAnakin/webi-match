import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BarChart2, Home, LogOut, MapPin, Power, PowerOff, RotateCcw, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_IDLE_TIMEOUT_MS } from "@/config/timings";
import { products } from "@/data/products";
import { STORES, getStoredStoreId, setStoredStoreId, getStoreById } from "@/data/stores";

// ─── Types ────────────────────────────────────────────────────────────────────
/** product_id → active boolean, loaded from Supabase */
type SettingsMap = Record<string, boolean>;

// Logout automático após inatividade — duração centralizada em src/config/timings.ts
const IDLE_TIMEOUT_MS = ADMIN_IDLE_TIMEOUT_MS;
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

// ─── Store Selector Modal ─────────────────────────────────────────────────────
const StoreSelectorModal = ({
  currentId,
  onSelect,
  onClose,
}: {
  currentId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}) => (
  <motion.div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    onClick={(e) => e.target === e.currentTarget && onClose()}
  >
    <motion.div
      className="w-full max-w-sm rounded-3xl border border-border bg-card p-8 shadow-2xl"
      initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
    >
      <div className="mb-6 text-center">
        <div className="mb-2 text-4xl">📍</div>
        <h2 className="text-lg font-bold text-foreground">Cambia Sede</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Seleziona la sede di questo dispositivo
        </p>
      </div>
      <div className="space-y-2.5">
        {STORES.map((store) => {
          const isActive = store.id === currentId;
          return (
            <motion.button
              key={store.id}
              onClick={() => onSelect(store.id)}
              className={`w-full rounded-2xl border px-5 py-4 text-left transition-all active:scale-95 ${
                isActive
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-secondary text-foreground hover:border-primary/40"
              }`}
              whileTap={{ scale: 0.97 }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{store.name}</span>
                {isActive && <span className="text-xs font-bold text-primary">✓ Attuale</span>}
              </div>
            </motion.button>
          );
        })}
      </div>
      <button
        onClick={onClose}
        className="mt-5 w-full text-center text-sm text-muted-foreground underline underline-offset-2"
      >
        Annulla
      </button>
    </motion.div>
  </motion.div>
);

// ─── Manager Dashboard ────────────────────────────────────────────────────────
const ManagerDashboard = ({ onLogout }: { onLogout: () => void }) => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [storeId, setStoreIdState] = useState<string>(
    () => getStoredStoreId() ?? "corso-vercelli"
  );
  const [showStoreModal, setShowStoreModal] = useState(false);

  const currentStore = getStoreById(storeId);

  useIdleLogout(onLogout);

  // Collect unique tags from all products
  const allTags = Array.from(new Set(products.flatMap((p) => p.tags))).sort();

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("product_settings")
      .select("product_id, active")
      .eq("store_id", storeId);

    if (data) {
      const map: SettingsMap = {};
      data.forEach((row) => { map[row.product_id] = row.active; });
      setSettings(map);
    }
    setLoading(false);
  }, [storeId]);

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
      .upsert({ product_id: productId, store_id: storeId, active: next, updated_at: new Date().toISOString() });

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

  // Sort: active first, then paused; then apply search + tag filter
  const sortedProducts = [...products].sort((a, b) => {
    const aOn = settings[a.id] !== false;
    const bOn = settings[b.id] !== false;
    if (aOn === bOn) return 0;
    return aOn ? -1 : 1;
  });

  const filteredProducts = sortedProducts.filter((p) => {
    const matchSearch = search === "" || p.name.toLowerCase().includes(search.toLowerCase());
    const matchTag = filterTag === null || p.tags.includes(filterTag);
    return matchSearch && matchTag;
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
            <button
              onClick={() => setShowStoreModal(true)}
              className="mt-0.5 flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <MapPin className="h-3 w-3" />
              {currentStore?.shortName ?? storeId}
            </button>
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
            <button
              onClick={() => { supabase.auth.signOut(); navigate("/"); }}
              className="flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground active:scale-95"
            >
              <Home className="h-3 w-3" />
              Quiz
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

        {/* Search + tag filter */}
        {!loading && (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Cerca prodotto…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-border bg-card pl-9 pr-9 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {search && (
                <button onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setFilterTag(null)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  filterTag === null
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}>
                Tutti
              </button>
              {allTags.map((tag) => (
                <button key={tag} onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                  className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                    filterTag === tag
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Product list */}
        {loading ? (
          <div className="py-20 text-center text-muted-foreground">Caricamento prodotti…</div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            Nessun prodotto trovato per "{search || filterTag}".
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map((product, i) => {
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

      {/* Store selector modal */}
      <AnimatePresence>
        {showStoreModal && (
          <StoreSelectorModal
            currentId={storeId}
            onSelect={(id) => {
              setStoredStoreId(id);
              setStoreIdState(id);
              setSettings({});
              setShowStoreModal(false);
            }}
            onClose={() => setShowStoreModal(false)}
          />
        )}
      </AnimatePresence>
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
