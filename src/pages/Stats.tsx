import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { products } from "@/data/products";

// ─── Accesso protetto da PIN ──────────────────────────────────────────────────
const STATS_PIN = "webidoo";

// ─── Tipi ────────────────────────────────────────────────────────────────────
interface Session {
  id: string;
  email: string;
  matched_product_id: string;
  match_percent: number;
  created_at: string;
}

interface DayCount {
  day: string;      // "Lun", "Mar", …
  date: string;     // "2026-04-01"
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
const Card = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <div className="rounded-2xl border border-border bg-card p-5 text-center shadow-card">
    <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
    <p className="text-4xl font-bold text-gradient">{value}</p>
    {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
  </div>
);

// ─── Pagina principale ────────────────────────────────────────────────────────
const Stats = () => {
  const [pin, setPin] = useState("");
  const [authed, setAuthed] = useState(false);
  const [pinError, setPinError] = useState(false);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Login ──
  const handleLogin = () => {
    if (pin.trim() === STATS_PIN) {
      setAuthed(true);
    } else {
      setPinError(true);
      setTimeout(() => setPinError(false), 1500);
    }
  };

  // ── Fetch sessioni ──
  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    supabase
      .from("quiz_sessions")
      .select("id, email, matched_product_id, match_percent, created_at")
      .order("created_at", { ascending: false })
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        else setSessions((data ?? []) as Session[]);
        setLoading(false);
      });
  }, [authed]);

  // ── Metriche calcolate ──
  const totalSessions = sessions.length;
  const uniqueEmails = new Set(sessions.map((s) => s.email.toLowerCase())).size;
  const avgMatch = totalSessions
    ? Math.round(sessions.reduce((sum, s) => sum + s.match_percent, 0) / totalSessions)
    : 0;
  const todaySessions = sessions.filter(
    (s) => new Date(s.created_at).toDateString() === new Date().toDateString()
  ).length;

  // Prodotti più matchati
  const productCounts: Record<string, number> = {};
  sessions.forEach((s) => {
    productCounts[s.matched_product_id] = (productCounts[s.matched_product_id] ?? 0) + 1;
  });
  const productStats: ProductStat[] = Object.entries(productCounts)
    .map(([id, count]) => ({
      id,
      name: productName(id),
      count,
      percent: totalSessions ? Math.round((count / totalSessions) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Sessioni ultimi 7 giorni
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

  // ── Login screen ──
  if (!authed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-8">
        <motion.div
          className="w-full max-w-sm space-y-6 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-5xl">📊</div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard Analytics</h1>
          <p className="text-sm text-muted-foreground">Inserisci il PIN per accedere</p>
          <motion.div
            animate={pinError ? { x: [-8, 8, -8, 8, 0] } : {}}
            transition={{ duration: 0.3 }}
          >
            <input
              type="password"
              placeholder="PIN"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setPinError(false); }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className={`w-full rounded-2xl border bg-card px-6 py-4 text-center text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-colors ${
                pinError ? "border-destructive focus:ring-destructive" : "border-border focus:ring-primary"
              }`}
            />
          </motion.div>
          {pinError && (
            <p className="text-sm text-destructive">PIN non corretto</p>
          )}
          <button
            onClick={handleLogin}
            className="gradient-primary shadow-glow w-full rounded-2xl px-8 py-4 text-lg font-bold text-primary-foreground active:scale-95"
          >
            Accedi
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Dashboard ──
  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-8">

        {/* Header */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-foreground">
            📊 Webi Match — Analytics
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Dati in tempo reale da Supabase
          </p>
        </motion.div>

        {loading && (
          <p className="text-center text-muted-foreground">Caricamento...</p>
        )}
        {error && (
          <p className="text-center text-destructive">Errore: {error}</p>
        )}

        {!loading && !error && (
          <AnimatePresence>
            {/* KPI Cards */}
            <motion.div
              className="grid grid-cols-2 gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card label="Sessioni totali" value={totalSessions} />
              <Card label="Email raccolte" value={uniqueEmails} />
              <Card label="Match medio" value={`${avgMatch}%`} />
              <Card label="Oggi" value={todaySessions} sub="sessioni" />
            </motion.div>

            {/* Prodotti più matchati */}
            <motion.div
              className="rounded-2xl border border-border bg-card p-6 shadow-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="mb-4 font-bold text-foreground">🏆 Prodotti più matchati</h2>
              {productStats.length === 0 && (
                <p className="text-sm text-muted-foreground">Nessun dato ancora.</p>
              )}
              <div className="space-y-3">
                {productStats.map((p, i) => (
                  <div key={p.id}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground truncate pr-2">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  "}{" "}
                        {p.name}
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
            </motion.div>

            {/* Sessioni ultimi 7 giorni */}
            <motion.div
              className="rounded-2xl border border-border bg-card p-6 shadow-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="mb-4 font-bold text-foreground">📅 Ultimi 7 giorni</h2>
              <div className="flex items-end justify-between gap-2 h-28">
                {dayCounts.map((d) => (
                  <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-xs font-bold text-primary">
                      {d.count > 0 ? d.count : ""}
                    </span>
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
              {sessions.length === 0 && (
                <p className="text-sm text-muted-foreground">Nessuna sessione registrata.</p>
              )}
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
            </motion.div>

          </AnimatePresence>
        )}

        <p className="pb-4 text-center text-xs text-muted-foreground">
          Webi Match · Analytics riservate a Webidoo
        </p>
      </div>
    </div>
  );
};

export default Stats;
