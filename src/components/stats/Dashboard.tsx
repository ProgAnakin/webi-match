import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut, RefreshCw, Package, Download, Shield, ShieldCheck,
  Calendar, ChevronDown, ChevronUp, Home, ChevronLeft, ChevronRight, TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { STORES, getStoreById } from "@/data/stores";
import { useIdleLogout } from "@/hooks/useIdleLogout";
import { StatCard } from "./StatCard";
import { MfaSetupModal } from "./MfaSetupModal";
import {
  QuizSession, FunnelCounts, DayCount, ProductStat,
  DAY_LABELS, productName, formatDate, storeName, exportCSV,
} from "./types";

const FETCH_LIMIT = 5000;
const PAGE_SIZE = 20;
const PRODUCT_PAGE_SIZE = 8;
const REFRESH_DEBOUNCE_MS = 3000;

interface DashboardProps {
  onLogout: () => void;
}

export const Dashboard = ({ onLogout }: DashboardProps) => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [funnel, setFunnel] = useState<FunnelCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const lastFetchRef = useRef<number>(0);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterStore, setFilterStore] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [page, setPage] = useState(0);
  const [productPage, setProductPage] = useState(0);
  const [search, setSearch] = useState("");
  const [hasMfa, setHasMfa] = useState(false);
  const [showMfaModal, setShowMfaModal] = useState(false);
  // GDPR export confirmation — true while awaiting user confirmation
  const [confirmExport, setConfirmExport] = useState(false);

  useIdleLogout(onLogout);

  /** Opens GDPR confirmation banner before downloading the CSV. */
  const handleExportRequest = () => setConfirmExport(true);
  const handleExportConfirm = () => {
    setConfirmExport(false);
    exportCSV(filteredSessions, dateFrom || undefined, dateTo || undefined);
  };

  useEffect(() => {
    supabase.auth.mfa.listFactors().then(({ data }) => {
      setHasMfa((data?.totp?.filter((f) => f.status === "verified")?.length ?? 0) > 0);
    });
  }, []);

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual && Date.now() - lastFetchRef.current < REFRESH_DEBOUNCE_MS) return;
    lastFetchRef.current = Date.now();
    setLoading(true); setHasError(false);

    const { data, error } = await supabase
      .from("quiz_sessions")
      .select("id, email, nome, cognome, matched_product_id, match_percent, created_at, store_id")
      .order("created_at", { ascending: false })
      .limit(FETCH_LIMIT);
    if (error) setHasError(true);
    else setSessions((data ?? []) as QuizSession[]);

    const [startedRes, resultRes, claimedRes] = await Promise.all([
      supabase.from("quiz_funnel_events").select("*", { count: "exact", head: true }).eq("event_type", "quiz_started"),
      supabase.from("quiz_funnel_events").select("*", { count: "exact", head: true }).eq("event_type", "result_shown"),
      supabase.from("quiz_funnel_events").select("*", { count: "exact", head: true }).eq("event_type", "claimed"),
    ]);
    setFunnel({
      started:     startedRes.count  ?? 0,
      resultShown: resultRes.count   ?? 0,
      claimed:     claimedRes.count  ?? 0,
    });

    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  // Reset to first page whenever filters change
  useEffect(() => { setPage(0); setProductPage(0); }, [dateFrom, dateTo, filterStore]);
  useEffect(() => { setPage(0); }, [search]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  // ─── Filtered + computed data ────────────────────────────────────────────────

  const filteredSessions = sessions.filter((s) => {
    const d = s.created_at.slice(0, 10);
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    if (filterStore && s.store_id !== filterStore) return false;
    return true;
  });

  const isFiltered = dateFrom !== "" || dateTo !== "" || filterStore !== null;
  const total = filteredSessions.length;
  const globalTotal = sessions.length;
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
  // Average match % per product
  const productMatchSums: Record<string, number> = {};
  filteredSessions.forEach((s) => {
    productMatchSums[s.matched_product_id] = (productMatchSums[s.matched_product_id] ?? 0) + s.match_percent;
  });

  const productStats: ProductStat[] = Object.entries(productCounts)
    .map(([id, count]) => ({
      id, name: productName(id), count,
      percent: total ? Math.round((count / total) * 100) : 0,
      avgMatch: Math.round((productMatchSums[id] ?? 0) / count),
    }))
    .sort((a, b) => b.count - a.count);

  // Product pagination
  const productTotalPages = Math.ceil(productStats.length / PRODUCT_PAGE_SIZE);
  const pagedProductStats = productStats.slice(productPage * PRODUCT_PAGE_SIZE, (productPage + 1) * PRODUCT_PAGE_SIZE);

  // Search + pagination for sessions
  const searchLower = search.toLowerCase().trim();
  const searchedSessions = searchLower
    ? filteredSessions.filter((s) => {
        const name = `${s.nome ?? ""} ${s.cognome ?? ""}`.toLowerCase();
        return (
          s.email.toLowerCase().includes(searchLower) ||
          productName(s.matched_product_id).toLowerCase().includes(searchLower) ||
          name.includes(searchLower)
        );
      })
    : filteredSessions;
  const pagedSessions = searchedSessions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(searchedSessions.length / PAGE_SIZE);

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

  // ─── Render ──────────────────────────────────────────────────────────────────

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
            <button onClick={handleExportRequest}
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

        {/* Date + store filter panel */}
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
                    <button onClick={() => setFilterStore(null)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        filterStore === null ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                      Tutte
                    </button>
                    {STORES.map((store) => (
                      <button key={store.id}
                        onClick={() => setFilterStore(filterStore === store.id ? null : store.id)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          filterStore === store.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}>
                        {store.shortName}
                      </button>
                    ))}
                  </div>
                </div>
                {isFiltered && (
                  <button onClick={() => { setDateFrom(""); setDateTo(""); setFilterStore(null); }}
                    className="text-xs text-primary underline underline-offset-2">
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
            {/* KPI cards */}
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

            {/* Top products */}
            <motion.div className="rounded-2xl border border-border bg-card p-6 shadow-card"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="mb-1 flex items-center gap-2">
                <h2 className="font-bold text-foreground">🏆 Prodotti più reclamati</h2>
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <p className="mb-4 text-[11px] text-muted-foreground">Ogni sessione = un utente che ha completato il claim</p>
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
                <>
                  <div className="space-y-3">
                    {pagedProductStats.map((p, i) => {
                      const globalIdx = productPage * PRODUCT_PAGE_SIZE + i;
                      return (
                        <div key={p.id}>
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="truncate pr-2 font-medium text-foreground">
                              {["🥇", "🥈", "🥉"][globalIdx] ?? "  "} {p.name}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              {p.avgMatch !== undefined && (
                                <span className="text-muted-foreground">⌀{p.avgMatch}%</span>
                              )}
                              <span className="font-bold text-primary">{p.count}x · {p.percent}%</span>
                            </div>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <motion.div className="h-full rounded-full gradient-primary"
                              initial={{ width: 0 }} animate={{ width: `${p.percent}%` }}
                              transition={{ duration: 0.6, delay: 0.3 + i * 0.05 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {productTotalPages > 1 && (
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <button
                        onClick={() => setProductPage((p) => Math.max(0, p - 1))}
                        disabled={productPage === 0}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground disabled:opacity-30 active:scale-95"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      {Array.from({ length: productTotalPages }, (_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setProductPage(idx)}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-semibold active:scale-95 ${
                            idx === productPage
                              ? "border-primary/40 bg-primary/10 text-primary"
                              : "border-border bg-muted text-muted-foreground"
                          }`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => setProductPage((p) => Math.min(productTotalPages - 1, p + 1))}
                        disabled={productPage >= productTotalPages - 1}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground disabled:opacity-30 active:scale-95"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>

            {/* Last 7 days chart */}
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

            {/* Funnel */}
            {funnel && funnel.started > 0 && (
              <motion.div className="rounded-2xl border border-border bg-card p-6 shadow-card"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                <h2 className="mb-4 font-bold text-foreground">🔽 Funnel di abbandono</h2>
                {[
                  { label: "Quiz avviati",       value: funnel.started,     color: "bg-blue-500"   },
                  { label: "Risultato mostrato", value: funnel.resultShown, color: "bg-orange-500" },
                  { label: "Reclamati (claim)",  value: funnel.claimed,     color: "bg-green-500"  },
                ].map(({ label, value, color }, i, arr) => {
                  const pctOfTotal = arr[0].value ? Math.round((value / arr[0].value) * 100) : 0;
                  const pctOfPrev  = i > 0 && arr[i - 1].value ? Math.round((value / arr[i - 1].value) * 100) : null;
                  const dropoff    = i > 0 ? arr[i - 1].value - value : 0;
                  return (
                    <div key={label} className="mb-4">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">{label}</span>
                        <div className="flex items-center gap-2 text-right">
                          <span className="font-semibold text-foreground">{value}</span>
                          {pctOfPrev !== null && (
                            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                              pctOfPrev >= 70 ? "bg-green-500/15 text-green-600"
                              : pctOfPrev >= 40 ? "bg-orange-500/15 text-orange-600"
                              : "bg-destructive/15 text-destructive"
                            }`}>
                              {pctOfPrev}% dal passo prec.
                            </span>
                          )}
                          {dropoff > 0 && (
                            <span className="text-muted-foreground">−{dropoff} usciti</span>
                          )}
                        </div>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <motion.div
                          className={`h-full rounded-full ${color}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${pctOfTotal}%` }}
                          transition={{ duration: 0.6, delay: 0.1 * i }}
                        />
                      </div>
                      <p className="mt-0.5 text-right text-[10px] text-muted-foreground">{pctOfTotal}% del totale avviati</p>
                    </div>
                  );
                })}
                <div className="mt-3 flex items-center justify-between rounded-xl bg-muted/50 px-4 py-2.5">
                  <span className="text-xs text-muted-foreground">Conversione finale (avviati → claim)</span>
                  <span className={`text-sm font-bold ${
                    funnel.started && (funnel.claimed / funnel.started) >= 0.5 ? "text-green-600"
                    : funnel.started && (funnel.claimed / funnel.started) >= 0.25 ? "text-orange-500"
                    : "text-destructive"
                  }`}>
                    {funnel.started ? Math.round((funnel.claimed / funnel.started) * 100) : 0}%
                  </span>
                </div>
              </motion.div>
            )}

            {/* Sessions list */}
            <motion.div className="rounded-2xl border border-border bg-card p-6 shadow-card"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-foreground">🕐 Sessioni</h2>
                  {filteredSessions.length > 0 && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {searchLower
                        ? `${searchedSessions.length} risultati · ${filteredSessions.length} totali`
                        : `${filteredSessions.length} totali`}
                      {totalPages > 1 && ` · pagina ${page + 1} di ${totalPages}`}
                    </p>
                  )}
                </div>
                {filteredSessions.length > 0 && (
                  <button onClick={handleExportRequest}
                    className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground active:scale-95">
                    <Download className="h-3 w-3" />
                    {filterStore ? `Esporta ${getStoreById(filterStore)?.shortName ?? ""}` : "Esporta CSV"}
                  </button>
                )}
              </div>
              {filteredSessions.length > 0 && (
                <div className="mb-3">
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cerca per nome, email o prodotto..."
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}
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
              ) : searchedSessions.length === 0 ? (
                <div className="rounded-xl border border-border bg-muted/30 px-4 py-6 text-center">
                  <p className="text-2xl mb-2">🔍</p>
                  <p className="text-sm font-medium text-foreground">Nessun risultato trovato</p>
                  <p className="text-xs text-muted-foreground mt-1">Prova con nome, email o nome prodotto.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {pagedSessions.map((s) => {
                      const fullName = [s.nome, s.cognome].filter(Boolean).join(" ");
                      return (
                        <div key={s.id}
                          className="flex items-center justify-between rounded-xl border border-border bg-background/40 px-4 py-3 text-sm">
                          <div className="overflow-hidden">
                            {fullName && (
                              <p className="truncate font-semibold text-foreground">{fullName}</p>
                            )}
                            <p className="truncate font-medium text-foreground/80">{s.email}</p>
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
                      );
                    })}
                  </div>

                  {/* Pagination controls */}
                  {totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-center gap-3">
                      <button
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground disabled:opacity-30 active:scale-95"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="text-xs text-muted-foreground">
                        {page + 1} / {totalPages}
                      </span>
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground disabled:opacity-30 active:scale-95"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </>
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

      {/* GDPR export confirmation */}
      <AnimatePresence>
        {confirmExport && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setConfirmExport(false)}
          >
            <motion.div
              className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl"
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
            >
              <p className="text-sm font-bold text-foreground mb-2">⚠️ Dati personali — GDPR</p>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                Il file contiene <strong className="text-foreground">indirizzi email</strong> dei clienti.
                Tratta questi dati in conformità al GDPR: non condividere il file, non conservarlo più del necessario
                e cancellalo dopo l'uso.
              </p>
              <div className="mb-5 rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                <strong className="text-foreground">{filteredSessions.length}</strong> sessioni
                {filterStore && <> · <span className="text-primary">{getStoreById(filterStore)?.shortName ?? filterStore}</span></>}
                {dateFrom && <> · da {dateFrom}</>}
                {dateTo && <> a {dateTo}</>}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmExport(false)}
                  className="flex-1 rounded-xl border border-border bg-muted px-4 py-2.5 text-sm text-muted-foreground active:scale-95"
                >
                  Annulla
                </button>
                <button
                  onClick={handleExportConfirm}
                  className="flex-1 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary active:scale-95"
                >
                  <Download className="inline h-3.5 w-3.5 mr-1.5" />
                  Scarica CSV
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
