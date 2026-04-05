import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, RefreshCw, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { products } from "@/data/products";
import type { Session } from "@supabase/supabase-js";

// ─── Tipi ────────────────────────────────────────────────────────────────────
interface QuizSession {
  id: string;
  email: string;
  matched_product_id: string;
  match_percent: number;
  created_at: string;
}

interface DayCount {
  day: string;
  date: string;
  count: number;
}

interface ProductStat {
  id: string;
  name: string;
  count: number;
  percent: number;
}

// ─── Utility ─────────────────────────────────────────────────────────────────
function productName(id: string) {
  return products.find((p) => p.id === id)?.name ?? id;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

// ─── Componenti UI ───────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <div className="rounded-2xl border border-border bg-card p-5 text-center shadow-card">
    <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
    <p className="text-4xl font-bold text-gradient">{value}</p>
    {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
  </div>
);

// ─── Login ────────────────────────────────────────────────────────────────────
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes

const LoginForm = ({ onLogin }: { onLogin: () => void }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  // Generic error — never expose internal Supabase messages to the UI
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil;
  const lockSecondsLeft = isLocked ? Math.ceil((lockedUntil! - Date.now()) / 1000) : 0;

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    if (isLocked) return;

    setLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    setLoading(false);

    if (authError) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= MAX_ATTEMPTS) {
        setLockedUntil(Date.now() + LOCKOUT_MS);
        setAttempts(0);
        setError(`Troppi tentativi. Riprova tra 5 minuti.`);
      } else {
        // Generic message — do not expose whether email exists or not
        setError(`Credenziali non valide. Riprova. (${MAX_ATTEMPTS - newAttempts} tentativi rimasti)`);
      }
    } else {
      setAttempts(0);
      onLogin();
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-8">
      <motion.div
        className="w-full max-w-sm space-y-5 text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-5xl">📊</div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Analytics</h1>
        <p className="text-sm text-muted-foreground">Accesso riservato a Webidoo</p>

        <div className="space-y-3 text-left">
          <input
            type="email"
            placeholder="Email"
            value={email}
            autoComplete="email"
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full rounded-2xl border border-border bg-card px-5 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            autoComplete="current-password"
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full rounded-2xl border border-border bg-card px-5 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-sm text-destructive"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <button
          onClick={handleLogin}
          disabled={loading || isLocked || !email.trim() || !password.trim()}
          className="gradient-primary shadow-glow w-full rounded-2xl px-8 py-4 text-lg font-bold text-primary-foreground active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Accesso in corso…" : isLocked ? `Bloccato — ${lockSecondsLeft}s` : "Accedi"}
        </button>
      </motion.div>
    </div>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
const FETCH_LIMIT = 500; // cap rows to prevent accidental DoS
const REFRESH_DEBOUNCE_MS = 3000; // minimum ms between manual refreshes

const Dashboard = ({ onLogout }: { onLogout: () => void }) => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const lastFetchRef = useRef<number>(0);

  const fetchData = useCallback(async (isManual = false) => {
    // Debounce manual refreshes to prevent hammering Supabase
    if (isManual && Date.now() - lastFetchRef.current < REFRESH_DEBOUNCE_MS) return;
    lastFetchRef.current = Date.now();

    setLoading(true);
    setHasError(false);
    const { data, error } = await supabase
      .from("quiz_sessions")
      .select("id, email, matched_product_id, match_percent, created_at")
      .order("created_at", { ascending: false })
      .limit(FETCH_LIMIT);

    if (error) {
      setHasError(true);
    } else {
      setSessions((data ?? []) as QuizSession[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  // Metriche
  const total = sessions.length;
  const uniqueEmails = new Set(sessions.map((s) => s.email.toLowerCase())).size;
  const avgMatch = total
    ? Math.round(sessions.reduce((sum, s) => sum + s.match_percent, 0) / total)
    : 0;
  const todaySessions = sessions.filter(
    (s) => new Date(s.created_at).toDateString() === new Date().toDateString()
  ).length;

  const productCounts: Record<string, number> = {};
  sessions.forEach((s) => {
    productCounts[s.matched_product_id] = (productCounts[s.matched_product_id] ?? 0) + 1;
  });
  const productStats: ProductStat[] = Object.entries(productCounts)
    .map(([id, count]) => ({
      id,
      name: productName(id),
      count,
      percent: total ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const dayCounts: DayCount[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const date = d.toISOString().slice(0, 10);
    return {
      day: DAY_LABELS[d.getDay()],
      date,
      count: sessions.filter((s) => s.created_at.slice(0, 10) === date).length,
    };
  });
  const maxDay = Math.max(...dayCounts.map((d) => d.count), 1);

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-8">

        {/* Header */}
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">📊 Analytics</h1>
            <p className="text-xs text-muted-foreground">Dati in tempo reale · Webidoo</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchData(true)}
              className="flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground active:scale-95"
            >
              <RefreshCw className="h-3 w-3" />
              Aggiorna
            </button>
            <button
              onClick={() => navigate("/manager")}
              className="flex items-center gap-1 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-primary active:scale-95"
            >
              <Package className="h-3 w-3" />
              Catalogo
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

        {loading && (
          <div className="py-20 text-center text-muted-foreground">Caricamento...</div>
        )}

        {hasError && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-center">
            <p className="text-sm text-destructive">
              Impossibile caricare i dati. Riprova o contatta l'amministratore.
            </p>
            <button onClick={() => fetchData(true)} className="mt-3 text-xs text-primary underline">
              Riprova
            </button>
          </div>
        )}

        {!loading && !hasError && (
          <>
            {/* KPI */}
            <motion.div
              className="grid grid-cols-2 gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <StatCard label="Sessioni totali" value={total} />
              <StatCard label="Email raccolte" value={uniqueEmails} />
              <StatCard label="Match medio" value={`${avgMatch}%`} />
              <StatCard label="Oggi" value={todaySessions} sub="sessioni" />
            </motion.div>

            {/* Prodotti */}
            <motion.div
              className="rounded-2xl border border-border bg-card p-6 shadow-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="mb-4 font-bold text-foreground">🏆 Prodotti più matchati</h2>
              {productStats.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nessun dato ancora.</p>
              ) : (
                <div className="space-y-3">
                  {productStats.map((p, i) => (
                    <div key={p.id}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="truncate pr-2 font-medium text-foreground">
                          {["🥇", "🥈", "🥉"][i] ?? "  "} {p.name}
                        </span>
                        <span className="shrink-0 font-bold text-primary">
                          {p.count}x · {p.percent}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <motion.div
                          className="h-full rounded-full gradient-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${p.percent}%` }}
                          transition={{ duration: 0.6, delay: 0.3 + i * 0.05 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Últimos 7 dias */}
            <motion.div
              className="rounded-2xl border border-border bg-card p-6 shadow-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="mb-4 font-bold text-foreground">📅 Ultimi 7 giorni</h2>
              <div className="flex h-28 items-end justify-between gap-2">
                {dayCounts.map((d) => (
                  <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-xs font-bold text-primary">{d.count > 0 ? d.count : ""}</span>
                    <div className="w-full rounded-t-lg bg-muted" style={{ height: "80px" }}>
                      <motion.div
                        className="w-full rounded-t-lg gradient-primary"
                        initial={{ height: 0 }}
                        animate={{ height: `${(d.count / maxDay) * 80}px` }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        style={{ marginTop: `${80 - (d.count / maxDay) * 80}px` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{d.day}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Ultime sessioni */}
            <motion.div
              className="rounded-2xl border border-border bg-card p-6 shadow-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="mb-4 font-bold text-foreground">🕐 Ultime sessioni</h2>
              {sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nessuna sessione registrata.</p>
              ) : (
                <div className="space-y-3">
                  {sessions.slice(0, 10).map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-xl border border-border bg-background/40 px-4 py-3 text-sm"
                    >
                      <div className="overflow-hidden">
                        <p className="truncate font-medium text-foreground">{s.email}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {productName(s.matched_product_id)}
                        </p>
                      </div>
                      <div className="ml-3 shrink-0 text-right">
                        <p className="font-bold text-primary">{s.match_percent}%</p>
                        <p className="text-[10px] text-muted-foreground">{formatDate(s.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            <p className="pb-4 text-center text-xs text-muted-foreground">
              Webi Match · Analytics riservate a Webidoo
            </p>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Pagina Stats (orchestratore) ─────────────────────────────────────────────
const Stats = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Verifica sessione Supabase Auth esistente
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
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
      {session ? (
        <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Dashboard onLogout={() => setSession(null)} />
        </motion.div>
      ) : (
        <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <LoginForm onLogin={() => {}} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Stats;
