import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ADMIN_IDLE_TIMEOUT_MS } from "@/config/timings";
import {
  LogOut, RefreshCw, Package, Download, Shield, ShieldCheck,
  X, Calendar, ChevronDown, ChevronUp, Home,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { products } from "@/data/products";
import { STORES, getStoreById } from "@/data/stores";
import type { Session } from "@supabase/supabase-js";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface QuizSession {
  id: string;
  email: string;
  matched_product_id: string;
  match_percent: number;
  created_at: string;
  store_id: string | null;
}
interface DayCount { day: string; date: string; count: number; }
interface ProductStat { id: string; name: string; count: number; percent: number; }
type AuthStep = "login" | "mfa" | "dashboard";

// ─── Utility ─────────────────────────────────────────────────────────────────
function productName(id: string) {
  return products.find((p) => p.id === id)?.name ?? id;
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleString("it-IT", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

function storeName(id: string | null): string {
  if (!id) return "—";
  return getStoreById(id)?.shortName ?? id;
}

function exportCSV(sessions: QuizSession[], fromDate?: string, toDate?: string) {
  const header = ["Email", "Prodotto", "Match %", "Sede", "Data"];
  const rows = sessions.map((s) => [
    `"${s.email.replace(/"/g, '""')}"`,
    `"${productName(s.matched_product_id).replace(/"/g, '""')}"`,
    s.match_percent,
    `"${storeName(s.store_id)}"`,
    `"${new Date(s.created_at).toLocaleString("it-IT")}"`,
  ]);
  const csv = [header, ...rows].map((r) => r.join(";")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const suffix = fromDate && toDate ? `_${fromDate}_a_${toDate}` : "";
  a.download = `webi-match${suffix}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

// ─── StatCard ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <div className="rounded-2xl border border-border bg-card p-5 text-center shadow-card">
    <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
    <p className="text-4xl font-bold text-gradient">{value}</p>
    {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
  </div>
);

// ─── Login ────────────────────────────────────────────────────────────────────
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;
const SS_ATTEMPTS = "wb_login_attempts";
const SS_LOCKED_UNTIL = "wb_locked_until";

const LoginForm = ({
  onLoginSuccess,
  onMfaRequired,
}: {
  onLoginSuccess: () => void;
  onMfaRequired: () => void;
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState<number>(() =>
    parseInt(sessionStorage.getItem(SS_ATTEMPTS) ?? "0", 10)
  );
  const [lockedUntil, setLockedUntil] = useState<number | null>(() => {
    const v = sessionStorage.getItem(SS_LOCKED_UNTIL);
    return v ? parseInt(v, 10) : null;
  });
  const isLocked = lockedUntil !== null && Date.now() < lockedUntil;
  const lockSecondsLeft = isLocked ? Math.ceil((lockedUntil! - Date.now()) / 1000) : 0;
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!isLocked) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [isLocked]);

  const persist = (n: number, until: number | null) => {
    setAttempts(n); sessionStorage.setItem(SS_ATTEMPTS, String(n));
    setLockedUntil(until);
    if (until) sessionStorage.setItem(SS_LOCKED_UNTIL, String(until));
    else sessionStorage.removeItem(SS_LOCKED_UNTIL);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim() || isLocked) return;
    setLoading(true); setError("");
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(), password,
    });
    setLoading(false);
    if (authError) {
      const n = attempts + 1;
      if (n >= MAX_ATTEMPTS) {
        persist(0, Date.now() + LOCKOUT_MS);
        setError("Troppi tentativi. Riprova tra 5 minuti.");
      } else {
        persist(n, null);
        setError(`Credenziali non valide. Riprova. (${MAX_ATTEMPTS - n} tentativi rimasti)`);
      }
    } else {
      persist(0, null);
      // Check if user has 2FA enrolled and needs to verify
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
          {loading ? "Accesso in corso…" : isLocked ? `Bloccato — ${lockSecondsLeft}s` : "Accedi"}
        </button>
      </motion.div>
    </div>
  );
};

// ─── MFA Verify ───────────────────────────────────────────────────────────────
const MfaVerifyForm = ({ onVerified, onCancel }: { onVerified: () => void; onCancel: () => void }) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    if (code.length !== 6) return;
    setLoading(true); setError("");
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const totp = factors?.totp?.[0];
    if (!totp) { setError("Nessun fattore 2FA trovato."); setLoading(false); return; }
    const { data: challenge, error: chalErr } = await supabase.auth.mfa.challenge({ factorId: totp.id });
    if (chalErr || !challenge) { setError("Errore. Riprova."); setLoading(false); return; }
    const { error: verErr } = await supabase.auth.mfa.verify({
      factorId: totp.id, challengeId: challenge.id, code,
    });
    setLoading(false);
    if (verErr) { setError("Codice non valido. Riprova."); setCode(""); }
    else onVerified();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-8">
      <motion.div className="w-full max-w-sm space-y-5 text-center"
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-5xl">🔐</div>
        <h1 className="text-2xl font-bold text-foreground">Verifica 2FA</h1>
        <p className="text-sm text-muted-foreground">Inserisci il codice a 6 cifre dall'app autenticatore</p>
        <input
          type="text" inputMode="numeric" maxLength={6} placeholder="000000"
          value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleVerify()}
          className="w-full rounded-2xl border border-border bg-card px-5 py-4 text-center text-2xl tracking-[0.4em] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <AnimatePresence>
          {error && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-sm text-destructive">{error}</motion.p>
          )}
        </AnimatePresence>
        <button onClick={handleVerify} disabled={loading || code.length !== 6}
          className="gradient-primary shadow-glow w-full rounded-2xl px-8 py-4 text-lg font-bold text-primary-foreground active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? "Verifica…" : "Conferma"}
        </button>
        <button onClick={onCancel} className="text-sm text-muted-foreground underline underline-offset-2">
          Annulla e torna al login
        </button>
      </motion.div>
    </div>
  );
};

// ─── MFA Setup Modal ──────────────────────────────────────────────────────────
const MfaSetupModal = ({ onClose, onEnabled }: { onClose: () => void; onEnabled: () => void }) => {
  const [step, setStep] = useState<"loading" | "qr" | "verify" | "done" | "already" | "error">("loading");
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
      // Unverified factors (aborted previous setup) need to be unenrolled first
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
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div className="w-full max-w-sm rounded-3xl border border-border bg-card p-8 shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
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
              Scansiona il QR code con <strong className="text-foreground">Google Authenticator</strong>,
              {" "}<strong className="text-foreground">Authy</strong> o simile.
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

// ─── Dashboard ────────────────────────────────────────────────────────────────
const FETCH_LIMIT = 500;
const REFRESH_DEBOUNCE_MS = 3000;
const IDLE_TIMEOUT_MS = ADMIN_IDLE_TIMEOUT_MS;
const IDLE_EVENTS = ["mousedown", "touchstart", "keydown", "scroll"] as const;

interface FunnelCounts { started: number; resultShown: number; claimed: number; }

const Dashboard = ({ onLogout }: { onLogout: () => void }) => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [funnel, setFunnel] = useState<FunnelCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const lastFetchRef = useRef<number>(0);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Date + store filter state
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterStore, setFilterStore] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // 2FA state
  const [hasMfa, setHasMfa] = useState(false);
  const [showMfaModal, setShowMfaModal] = useState(false);

  // Check MFA status
  useEffect(() => {
    supabase.auth.mfa.listFactors().then(({ data }) => {
      setHasMfa((data?.totp?.filter((f) => f.status === "verified")?.length ?? 0) > 0);
    });
  }, []);

  // Auto-logout after 30 min idle
  useEffect(() => {
    const reset = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(async () => {
        await supabase.auth.signOut();
        onLogout();
      }, IDLE_TIMEOUT_MS);
    };
    reset();
    IDLE_EVENTS.forEach((ev) => window.addEventListener(ev, reset, { passive: true }));
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      IDLE_EVENTS.forEach((ev) => window.removeEventListener(ev, reset));
    };
  }, [onLogout]);

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual && Date.now() - lastFetchRef.current < REFRESH_DEBOUNCE_MS) return;
    lastFetchRef.current = Date.now();
    setLoading(true); setHasError(false);
    const { data, error } = await supabase
      .from("quiz_sessions")
      .select("id, email, matched_product_id, match_percent, created_at, store_id")
      .order("created_at", { ascending: false })
      .limit(FETCH_LIMIT);
    if (error) setHasError(true);
    else setSessions((data ?? []) as QuizSession[]);

    // Funnel counts — failures here are non-critical, just skip display
    const { data: funnelData } = await supabase
      .from("quiz_funnel_events")
      .select("event_type");
    if (funnelData) {
      const count = (type: string) => funnelData.filter((r) => r.event_type === type).length;
      setFunnel({ started: count("quiz_started"), resultShown: count("result_shown"), claimed: count("claimed") });
    }

    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  // Filter sessions by date range + store
  const filteredSessions = sessions.filter((s) => {
    const d = s.created_at.slice(0, 10);
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    if (filterStore && s.store_id !== filterStore) return false;
    return true;
  });

  const isFiltered = dateFrom !== "" || dateTo !== "" || filterStore !== null;

  // KPI — computed from filtered sessions
  const total = filteredSessions.length;
  const globalTotal = sessions.length; // all sessions, no filter applied
  const uniqueEmails = new Set(filteredSessions.map((s) => s.email.toLowerCase())).size;
  const avgMatch = total
    ? Math.round(filteredSessions.reduce((sum, s) => sum + s.match_percent, 0) / total)
    : 0;
  const todaySessions = filteredSessions.filter(
    (s) => new Date(s.created_at).toDateString() === new Date().toDateString()
  ).length;

  const productCounts: Record<string, number> = {};
  filteredSessions.forEach((s) => {
    productCounts[s.matched_product_id] = (productCounts[s.matched_product_id] ?? 0) + 1;
  });
  const productStats: ProductStat[] = Object.entries(productCounts)
    .map(([id, count]) => ({
      id, name: productName(id), count,
      percent: total ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Chart — always last 7 days (independent of filter)
  const dayCounts: DayCount[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const date = d.toISOString().slice(0, 10);
    return {
      day: DAY_LABELS[d.getDay()], date,
      count: sessions.filter((s) => s.created_at.slice(0, 10) === date).length,
    };
  });
  const maxDay = Math.max(...dayCounts.map((d) => d.count), 1);

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-8">

        {/* Header */}
        <motion.div className="flex items-center justify-between"
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div>
            <h1 className="text-2xl font-bold text-foreground">📊 Analytics</h1>
            <p className="text-xs text-muted-foreground">Dati in tempo reale · Webidoo</p>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <button onClick={() => fetchData(true)}
              className="flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground active:scale-95">
              <RefreshCw className="h-3 w-3" /> Aggiorna
            </button>
            <button onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center gap-1 rounded-xl border px-3 py-2 text-xs active:scale-95 ${
                isFiltered
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground"
              }`}>
              <Calendar className="h-3 w-3" />
              {isFiltered ? "Filtro attivo" : "Filtra"}
              {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            <button onClick={() => exportCSV(filteredSessions, dateFrom || undefined, dateTo || undefined)}
              disabled={filteredSessions.length === 0}
              className="flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground active:scale-95 disabled:opacity-40">
              <Download className="h-3 w-3" /> CSV
            </button>
            <button onClick={() => navigate("/manager")}
              className="flex items-center gap-1 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-primary active:scale-95">
              <Package className="h-3 w-3" /> Catalogo
            </button>
            <button onClick={() => setShowMfaModal(true)}
              title={hasMfa ? "2FA attivo" : "Configura 2FA"}
              className={`flex items-center gap-1 rounded-xl border px-3 py-2 text-xs active:scale-95 ${
                hasMfa
                  ? "border-green-500/40 bg-green-500/10 text-green-400"
                  : "border-border bg-card text-muted-foreground"
              }`}>
              {hasMfa ? <ShieldCheck className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
              2FA
            </button>
            <button onClick={handleLogout}
              className="flex items-center gap-1 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive active:scale-95">
              <LogOut className="h-3 w-3" /> Esci
            </button>
            <button onClick={() => { supabase.auth.signOut(); navigate("/"); }}
              className="flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground active:scale-95">
              <Home className="h-3 w-3" /> Quiz
            </button>
          </div>
        </motion.div>

        {/* Date filter panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Filtra per data
                </p>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">Da</label>
                    <input type="date" value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">A</label>
                    <input type="date" value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Sede</p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setFilterStore(null)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        filterStore === null
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      Tutte
                    </button>
                    {STORES.map((store) => (
                      <button
                        key={store.id}
                        onClick={() => setFilterStore(filterStore === store.id ? null : store.id)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          filterStore === store.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {store.shortName}
                      </button>
                    ))}
                  </div>
                </div>
                {isFiltered && (
                  <button
                    onClick={() => { setDateFrom(""); setDateTo(""); setFilterStore(null); }}
                    className="text-xs text-primary underline underline-offset-2"
                  >
                    Rimuovi tutti i filtri
                  </button>
                )}
                {isFiltered && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{filteredSessions.length}</span>
                    {filterStore ? ` sessioni · ${getStoreById(filterStore)?.shortName ?? filterStore}` : " sessioni nel periodo"}
                    {filterStore && (
                      <span className="ml-1 text-muted-foreground/60">({globalTotal} totale)</span>
                    )}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading && <div className="py-20 text-center text-muted-foreground">Caricamento...</div>}
        {hasError && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-center">
            <p className="text-sm text-destructive">Impossibile caricare i dati. Riprova o contatta l'amministratore.</p>
            <button onClick={() => fetchData(true)} className="mt-3 text-xs text-primary underline">Riprova</button>
          </div>
        )}

        {!loading && !hasError && (
          <>
            {/* KPI */}
            <motion.div className="grid grid-cols-2 gap-4"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <StatCard
                label="Sessioni totali"
                value={total}
                sub={filterStore
                  ? `${getStoreById(filterStore)?.shortName} · ${globalTotal} globale`
                  : (isFiltered ? "nel periodo" : undefined)}
              />
              <StatCard label="Email raccolte" value={uniqueEmails} sub={isFiltered ? "nel periodo" : undefined} />
              <StatCard label="Match medio" value={`${avgMatch}%`} />
              <StatCard label="Oggi" value={todaySessions} sub="sessioni" />
            </motion.div>

            {/* Prodotti */}
            <motion.div className="rounded-2xl border border-border bg-card p-6 shadow-card"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h2 className="mb-4 font-bold text-foreground">🏆 Prodotti più matchati</h2>
              {productStats.length === 0 ? (
                <div className="text-center py-3">
                  <p className="text-sm font-medium text-foreground">
                    {isFiltered ? "Nessun prodotto nel periodo selezionato" : "Nessun match ancora"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isFiltered ? "Espandi le date per vedere i dati." : "I prodotti più matchati appariranno qui."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {productStats.map((p, i) => (
                    <div key={p.id}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="truncate pr-2 font-medium text-foreground">
                          {["🥇", "🥈", "🥉"][i] ?? "  "} {p.name}
                        </span>
                        <span className="shrink-0 font-bold text-primary">{p.count}x · {p.percent}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <motion.div className="h-full rounded-full gradient-primary"
                          initial={{ width: 0 }} animate={{ width: `${p.percent}%` }}
                          transition={{ duration: 0.6, delay: 0.3 + i * 0.05 }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Ultimi 7 giorni — sempre last 7 days, indipendente dal filtro */}
            <motion.div className="rounded-2xl border border-border bg-card p-6 shadow-card"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h2 className="mb-1 font-bold text-foreground">📅 Ultimi 7 giorni</h2>
              {isFiltered && (
                <p className="mb-4 text-[10px] text-muted-foreground">
                  Il grafico mostra sempre gli ultimi 7 giorni reali, indipendente dal filtro data.
                </p>
              )}
              <div className="flex h-28 items-end justify-between gap-2 mt-4">
                {dayCounts.map((d) => (
                  <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-xs font-bold text-primary">{d.count > 0 ? d.count : ""}</span>
                    <div className="w-full rounded-t-lg bg-muted" style={{ height: "80px" }}>
                      <motion.div className="w-full rounded-t-lg gradient-primary"
                        initial={{ height: 0 }}
                        animate={{ height: `${(d.count / maxDay) * 80}px` }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        style={{ marginTop: `${80 - (d.count / maxDay) * 80}px` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{d.day}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Funnel di abbandono */}
            {funnel && funnel.started > 0 && (
              <motion.div className="rounded-2xl border border-border bg-card p-6 shadow-card"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                <h2 className="mb-4 font-bold text-foreground">🔽 Funil de abandono</h2>
                {[
                  { label: "Quiz avviati", value: funnel.started, color: "bg-blue-500" },
                  { label: "Risultato mostrato", value: funnel.resultShown, color: "bg-orange-500" },
                  { label: "Reclamati (claim)", value: funnel.claimed, color: "bg-green-500" },
                ].map(({ label, value, color }, i, arr) => {
                  const pct = arr[0].value ? Math.round((value / arr[0].value) * 100) : 0;
                  const dropoff = i > 0 ? arr[i - 1].value - value : 0;
                  return (
                    <div key={label} className="mb-3">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">{label}</span>
                        <span className="text-muted-foreground">
                          <span className="font-semibold text-foreground">{value}</span>
                          {" "}({pct}%)
                          {dropoff > 0 && <span className="ml-1 text-destructive">−{dropoff} abbandonati</span>}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <motion.div
                          className={`h-full rounded-full ${color}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: 0.1 * i }}
                        />
                      </div>
                    </div>
                  );
                })}
                <p className="mt-2 text-xs text-muted-foreground">
                  Tasso di conversione finale: <span className="font-semibold text-foreground">
                    {funnel.started ? Math.round((funnel.claimed / funnel.started) * 100) : 0}%
                  </span>
                </p>
              </motion.div>
            )}

            {/* Sessioni */}
            <motion.div className="rounded-2xl border border-border bg-card p-6 shadow-card"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-bold text-foreground">🕐 Ultime sessioni</h2>
                {filteredSessions.length > 0 && (
                  <button onClick={() => exportCSV(filteredSessions, dateFrom || undefined, dateTo || undefined)}
                    className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground active:scale-95">
                    <Download className="h-3 w-3" /> Esporta CSV
                  </button>
                )}
              </div>
              {filteredSessions.length === 0 ? (
                <div className="rounded-xl border border-border bg-muted/30 px-4 py-6 text-center">
                  <p className="text-2xl mb-2">📭</p>
                  <p className="text-sm font-medium text-foreground">
                    {isFiltered ? "Nessuna sessione trovata" : "Nessuna sessione ancora"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isFiltered
                      ? "Prova ad espandere le date o a cambiare la sede selezionata."
                      : "Avvia il quiz sull'iPad per iniziare a raccogliere dati."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSessions.slice(0, 10).map((s) => (
                    <div key={s.id}
                      className="flex items-center justify-between rounded-xl border border-border bg-background/40 px-4 py-3 text-sm">
                      <div className="overflow-hidden">
                        <p className="truncate font-medium text-foreground">{s.email}</p>
                        <p className="truncate text-xs text-muted-foreground">{productName(s.matched_product_id)}</p>
                        {s.store_id && (
                          <p className="text-[10px] text-primary/70 mt-0.5">📍 {storeName(s.store_id)}</p>
                        )}
                      </div>
                      <div className="ml-3 shrink-0 text-right">
                        <p className="font-bold text-primary">{s.match_percent}%</p>
                        <p className="text-[10px] text-muted-foreground">{formatDate(s.created_at)}</p>
                      </div>
                    </div>
                  ))}
                  {filteredSessions.length > 10 && (
                    <p className="text-center text-xs text-muted-foreground">
                      + {filteredSessions.length - 10} sessioni nel CSV
                    </p>
                  )}
                </div>
              )}
            </motion.div>

            <p className="pb-4 text-center text-xs text-muted-foreground">
              Webi Match · Analytics riservate a Webidoo
            </p>
          </>
        )}
      </div>

      {/* 2FA Modal */}
      <AnimatePresence>
        {showMfaModal && (
          <MfaSetupModal
            onClose={() => setShowMfaModal(false)}
            onEnabled={() => setHasMfa(true)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Stats (orchestratore) ────────────────────────────────────────────────────
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
