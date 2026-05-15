import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Search, X, Copy, Check, Mail, Clock, AlertCircle, XCircle, CheckCircle2, ChevronLeft, ChevronRight, Download, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { products } from "@/data/products";
import { STORES } from "@/data/stores";

interface Session {
  id: string;
  email: string;
  nome: string | null;
  cognome: string | null;
  matched_product_id: string;
  match_percent: number;
  email_sent: boolean | null;
  discount_code: string | null;
  created_at: string;
  store_id: string | null;
  code_redeemed: boolean;
  code_redeemed_at: string | null;
}

type StatusFilter = "all" | "enviada" | "processando" | "sem_email" | "falhou";

function productName(id: string) {
  return products.find((p) => p.id === id)?.name ?? id;
}

function storeName(id: string | null) {
  if (!id) return "—";
  return STORES.find((s) => s.id === id)?.shortName ?? id;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("it-IT", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function getSessionStatus(s: Session): "enviada" | "processando" | "sem_email" | "falhou" {
  if (s.email_sent) return "enviada";
  const ageMin = (Date.now() - new Date(s.created_at).getTime()) / 60_000;
  if (ageMin < 5) return "processando";
  if (s.discount_code) return "sem_email";
  return "falhou";
}

function isCodeExpired(s: Session): boolean {
  return (Date.now() - new Date(s.created_at).getTime()) > 24 * 3_600_000;
}

function hoursUntilExpiry(s: Session): number | null {
  const msLeft = (new Date(s.created_at).getTime() + 24 * 3_600_000) - Date.now();
  if (msLeft <= 0) return null;
  return Math.ceil(msLeft / 3_600_000);
}

const STATUS_META = {
  enviada:     { label: "ENVIADA",     icon: Mail,        cls: "border-green-500/40 bg-green-500/10 text-green-400"       },
  processando: { label: "PROCESSANDO", icon: Clock,       cls: "border-amber-500/40 bg-amber-500/10 text-amber-400"       },
  sem_email:   { label: "SEM EMAIL",   icon: AlertCircle, cls: "border-orange-500/40 bg-orange-500/10 text-orange-400"    },
  falhou:      { label: "FALHOU",      icon: XCircle,     cls: "border-destructive/40 bg-destructive/10 text-destructive" },
};

interface SessionsTabProps {
  storeId: string;
  isGlobal: boolean;
}

export const SessionsTab = ({ storeId, isGlobal }: SessionsTabProps) => {
  const [sessions, setSessions] = useState<Session[]>([]);   // current page
  const [kpiData, setKpiData] = useState<Pick<Session, "id" | "email_sent" | "discount_code" | "created_at" | "code_redeemed">[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [negadoCount, setNegadoCount] = useState(0);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purging, setPurging] = useState(false);
  const [purgePreviewCount, setPurgePreviewCount] = useState<number | null>(null);
  const [purgedCount, setPurgedCount] = useState<number | null>(null);

  const PAGE_SIZE = 20;
  const [currentPage, setCurrentPage] = useState(1);

  // Lightweight fetch of all sessions (status fields only) for KPI cards
  const fetchKpiData = useCallback(async () => {
    let q = supabase
      .from("quiz_sessions")
      .select("id, email_sent, discount_code, created_at, code_redeemed");
    if (!isGlobal) q = q.eq("store_id", storeId);
    const { data } = await q;
    setKpiData((data ?? []) as typeof kpiData);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, isGlobal]);

  // Server-side paginated fetch with search applied
  const fetchSessions = useCallback(async () => {
    setLoading(true);
    const from = (currentPage - 1) * PAGE_SIZE;

    let query = supabase
      .from("quiz_sessions")
      .select("id, email, nome, cognome, matched_product_id, match_percent, email_sent, discount_code, created_at, store_id, code_redeemed, code_redeemed_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (!isGlobal) query = query.eq("store_id", storeId);
    if (search.trim()) {
      const q = search.trim();
      query = query.or(`email.ilike.%${q}%,discount_code.ilike.%${q}%,nome.ilike.%${q}%,cognome.ilike.%${q}%`);
    }

    const { data, count } = await query;
    setSessions((data ?? []) as Session[]);
    setTotalCount(count ?? 0);
    setLoading(false);
  }, [storeId, isGlobal, currentPage, search]);

  const fetchNegado = useCallback(async () => {
    const [shownRes, claimedRes] = await Promise.all([
      supabase.from("quiz_funnel_events").select("*", { count: "exact", head: true }).eq("event_type", "result_shown"),
      supabase.from("quiz_funnel_events").select("*", { count: "exact", head: true }).eq("event_type", "claimed"),
    ]);
    const negado = (shownRes.count ?? 0) - (claimedRes.count ?? 0);
    setNegadoCount(Math.max(0, negado));
  }, []);

  useEffect(() => {
    fetchKpiData();
    fetchNegado();
  }, [fetchKpiData, fetchNegado]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Reset to page 1 when search or status filter changes
  useEffect(() => { setCurrentPage(1); }, [search, statusFilter]);

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch { /* clipboard unavailable */ }
  };

  // ── Mark code redeemed — uses RPC to bypass RLS ─────────────────────────
  const markRedeemed = async (s: Session) => {
    if (redeemingId) return;
    setRedeemingId(s.id);
    setRedeemError(null);
    const { data: rowsUpdated, error } = await supabase.rpc("mark_code_redeemed", { p_session_id: s.id } as never);
    if (!error && (rowsUpdated as number) > 0) {
      setSessions((prev) =>
        prev.map((row) =>
          row.id === s.id
            ? { ...row, code_redeemed: true, code_redeemed_at: new Date().toISOString() }
            : row
        )
      );
    } else if (!error && (rowsUpdated as number) === 0) {
      setRedeemError("0 righe aggiornate — controlla che la funzione SQL sia aggiornata con SET row_security = off.");
    } else if (error) {
      setRedeemError(`Errore: ${error.message} (code: ${error.code})`);
    }
    setRedeemingId(null);
  };

  // ── Export all sessions to CSV ──────────────────────────────────────────
  const exportToCSV = useCallback(async () => {
    setExporting(true);
    let query = supabase
      .from("quiz_sessions")
      .select("id, email, nome, cognome, matched_product_id, match_percent, email_sent, discount_code, created_at, store_id, code_redeemed, code_redeemed_at")
      .order("created_at", { ascending: false });

    if (!isGlobal) query = query.eq("store_id", storeId);

    const { data } = await query;
    const rows = (data ?? []) as Session[];

    const headers = ["Nome", "Cognome", "Email", "Prodotto", "Match %", "Store", "Data", "Codice Sconto", "Stato Codice", "Usato Il"];
    const csvRows = rows.map((s) => [
      s.nome ?? "",
      s.cognome ?? "",
      s.email,
      productName(s.matched_product_id),
      s.match_percent,
      storeName(s.store_id),
      formatDate(s.created_at),
      s.discount_code ?? "",
      s.code_redeemed ? "usato" : isCodeExpired(s) ? "scaduto" : s.discount_code ? "valido" : "sem codice",
      s.code_redeemed_at ? formatDate(s.code_redeemed_at) : "",
    ]);

    const csvContent = [headers, ...csvRows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    // BOM prefix ensures Excel opens UTF-8 correctly
    const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `webi-match-sessioni-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExporting(false);
  }, [storeId, isGlobal]);

  // ── Preview purge count then open modal ────────────────────────────────
  const openPurgeModal = useCallback(async () => {
    setPurgePreviewCount(null);
    setShowPurgeModal(true);
    let query = supabase
      .from("quiz_sessions")
      .select("id", { count: "exact", head: true })
      .lt("created_at", new Date(Date.now() - 7 * 24 * 3_600_000).toISOString());
    if (!isGlobal) query = query.eq("store_id", storeId);
    const { count } = await query;
    setPurgePreviewCount(count ?? 0);
  }, [storeId, isGlobal]);

  // ── Execute purge via RPC ───────────────────────────────────────────────
  const executePurge = useCallback(async () => {
    setPurging(true);
    const { data } = await supabase.rpc("purge_sessions_older_than", { p_days: 7 } as never);
    setPurging(false);
    setShowPurgeModal(false);
    setPurgedCount(data as number ?? 0);
    fetchSessions();
    fetchKpiData();
    fetchNegado();
  }, [fetchSessions, fetchKpiData, fetchNegado]);

  // Status filter applies client-side on the fetched page; search is server-side.
  const filtered = statusFilter === "all"
    ? sessions
    : sessions.filter((s) => getSessionStatus(s) === statusFilter);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage   = Math.min(currentPage, totalPages);
  const paginated  = filtered;   // server already returned just this page

  // KPI counts come from kpiData (all sessions, no pagination)
  const counts = {
    all:         kpiData.length,
    enviada:     kpiData.filter((s) => s.email_sent).length,
    processando: kpiData.filter((s) => {
      if (s.email_sent) return false;
      return (Date.now() - new Date(s.created_at).getTime()) / 60_000 < 5;
    }).length,
    sem_email:   kpiData.filter((s) => {
      if (s.email_sent) return false;
      if (!s.discount_code) return false;
      return (Date.now() - new Date(s.created_at).getTime()) / 60_000 >= 5;
    }).length,
    falhou:      kpiData.filter((s) => !s.email_sent && !s.discount_code).length,
  };

  const expiredReusable = kpiData.filter(
    (s) => (Date.now() - new Date(s.created_at).getTime()) > 24 * 3_600_000
      && s.discount_code && !s.code_redeemed
  ).length;

  const redemptionTotal = kpiData.filter((s) => s.discount_code !== null).length;
  const redemptionUsed  = kpiData.filter((s) => s.code_redeemed === true).length;
  const redemptionPct   = redemptionTotal > 0 ? Math.round((redemptionUsed / redemptionTotal) * 100) : 0;
  const redemptionColor =
    redemptionPct > 50 ? "text-green-400" :
    redemptionPct >= 20 ? "text-amber-400" :
    "text-muted-foreground";
  const redemptionBorderBg =
    redemptionPct > 50 ? "border-green-500/20 bg-green-500/5" :
    redemptionPct >= 20 ? "border-amber-500/20 bg-amber-500/5" :
    "border-border bg-muted/20";

  const localNegado = kpiData.filter((s) => !s.email_sent && !s.discount_code).length;

  return (
    <div className="space-y-5">

      {/* Summary KPIs */}
      <motion.div
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      >
        <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{counts.enviada}</p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Emails enviadas</p>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">{counts.processando}</p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Processando</p>
        </div>
        <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 text-center">
          <p className="text-2xl font-bold text-orange-400">{counts.sem_email}</p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sem email</p>
        </div>
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-center">
          <p className="text-2xl font-bold text-destructive">{counts.falhou}</p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Falharam</p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/20 p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{negadoCount}</p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Match negado</p>
          <p className="mt-0.5 text-[9px] text-muted-foreground/50">({localNegado} da lista)</p>
        </div>
        <div className={`rounded-2xl border p-4 text-center ${redemptionBorderBg}`}>
          <p className={`text-2xl font-bold ${redemptionColor}`}>{redemptionUsed}/{redemptionTotal}</p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Codici usati</p>
          <p className={`mt-0.5 text-[9px] font-semibold ${redemptionColor}`}>{redemptionPct}%</p>
        </div>
      </motion.div>

      {/* Expired codes info */}
      {expiredReusable > 0 && (
        <motion.div
          className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-muted-foreground"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
          💡 <strong className="text-foreground">{expiredReusable}</strong> codici scaduti (più di 24h) possono essere riutilizzati manualmente per nuovi clienti — copia il codice e consegnalo al consulente.
        </motion.div>
      )}

      {/* Redeem error feedback */}
      <AnimatePresence>
        {redeemError && (
          <motion.div
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-400 flex items-center justify-between"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          >
            <span>{redeemError}</span>
            <button onClick={() => setRedeemError(null)} className="ml-3 opacity-60 hover:opacity-100"><X className="h-3.5 w-3.5" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Purge success feedback */}
      <AnimatePresence>
        {purgedCount !== null && (
          <motion.div
            className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-xs text-green-400 flex items-center justify-between"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          >
            <span>✓ <strong>{purgedCount}</strong> sessioni eliminate con successo.</span>
            <button onClick={() => setPurgedCount(null)} className="ml-3 opacity-60 hover:opacity-100"><X className="h-3.5 w-3.5" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Cerca per email, nome o codice sconto…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-border bg-card pl-9 pr-9 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Status filter + actions */}
      <div className="flex flex-wrap gap-2">
        {(["all", "enviada", "processando", "sem_email", "falhou"] as StatusFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              statusFilter === f
                ? f === "all"         ? "bg-primary text-primary-foreground"
                : f === "enviada"     ? "bg-green-500/20  text-green-400  border border-green-500/40"
                : f === "processando" ? "bg-amber-500/20  text-amber-400  border border-amber-500/40"
                : f === "sem_email"   ? "bg-orange-500/20 text-orange-400 border border-orange-500/40"
                :                       "bg-destructive/20 text-destructive border border-destructive/40"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {f === "all"         ? `Tutti (${counts.all})`
              : f === "enviada"     ? `Enviada (${counts.enviada})`
              : f === "processando" ? `Processando (${counts.processando})`
              : f === "sem_email"   ? `Sem email (${counts.sem_email})`
              :                       `Falhou (${counts.falhou})`}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          {/* Export CSV */}
          <button
            onClick={exportToCSV}
            disabled={exporting}
            className="flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-green-500/40 hover:bg-green-500/10 hover:text-green-400 active:scale-95 transition-colors disabled:opacity-50"
            title="Esporta tutte le sessioni in CSV (apribile in Excel)"
          >
            <Download className="h-3 w-3" /> {exporting ? "…" : "Esporta CSV"}
          </button>

          {/* Purge old sessions */}
          <button
            onClick={openPurgeModal}
            className="flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive active:scale-95 transition-colors"
            title="Elimina sessioni più vecchie di 7 giorni"
          >
            <Trash2 className="h-3 w-3" /> Pulisci (7gg)
          </button>

          {/* Refresh */}
          <button
            onClick={() => { fetchSessions(); fetchKpiData(); fetchNegado(); }}
            className="flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground active:scale-95"
          >
            <RefreshCw className="h-3 w-3" /> Aggiorna
          </button>
        </div>
      </div>

      {/* Session list */}
      {loading ? (
        <div className="py-16 text-center text-muted-foreground text-sm">Caricamento sessioni…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-muted/20 py-12 text-center">
          <p className="text-2xl mb-2">📭</p>
          <p className="text-sm font-medium text-foreground">
            {search ? "Nessun risultato trovato" : "Nessuna sessione"}
          </p>
          {search && <p className="text-xs text-muted-foreground mt-1">Prova con un'altra email o codice.</p>}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {totalCount} sessioni{search ? ` (ricerca: "${search}")` : ""}
              {statusFilter !== "all" && ` · filtro: ${statusFilter}`}
              {totalPages > 1 && ` · pagina ${safePage} di ${totalPages}`}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground disabled:opacity-30 active:scale-95 hover:text-foreground"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="min-w-[3rem] text-center text-xs font-semibold text-foreground">
                  {safePage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground disabled:opacity-30 active:scale-95 hover:text-foreground"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
          <AnimatePresence initial={false}>
            {paginated.map((s, i) => {
              const status = getSessionStatus(s);
              const meta = STATUS_META[status];
              const expired = isCodeExpired(s);
              const hrsLeft = s.discount_code && !expired ? hoursUntilExpiry(s) : null;
              const expiringSoon = hrsLeft !== null && hrsLeft <= 4 && hrsLeft > 0;
              const fullName = [s.nome, s.cognome].filter(Boolean).join(" ");
              const StatusIcon = meta.icon;
              const isRedeeming = redeemingId === s.id;

              return (
                <motion.div
                  key={s.id}
                  className="rounded-2xl border border-border bg-card p-4"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      {fullName && (
                        <p className="truncate text-sm font-bold text-foreground">{fullName}</p>
                      )}
                      <p className="truncate text-xs text-foreground/80">{s.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {productName(s.matched_product_id)} · <span className="text-primary font-semibold">{s.match_percent}%</span>
                        {isGlobal && s.store_id && (
                          <span className="ml-1.5 text-primary/60">· {storeName(s.store_id)}</span>
                        )}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60">{formatDate(s.created_at)}</p>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${meta.cls}`}>
                        <StatusIcon className="h-3 w-3" />
                        {meta.label}
                      </span>

                      {s.discount_code ? (
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <code className={`rounded-lg px-2 py-1 text-[11px] font-mono font-bold ${
                              s.code_redeemed
                                ? "bg-muted text-muted-foreground line-through"
                                : expired
                                ? "bg-muted text-muted-foreground line-through"
                                : "bg-primary/10 text-primary"
                            }`}>
                              {s.discount_code}
                            </code>

                            {s.code_redeemed ? (
                              <span className="rounded-full bg-green-500/10 px-1.5 py-0.5 text-[9px] font-bold text-green-400 uppercase">
                                usato
                              </span>
                            ) : expired ? (
                              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground uppercase">
                                scaduto
                              </span>
                            ) : expiringSoon ? (
                              <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 uppercase">
                                scade in {hrsLeft}h
                              </span>
                            ) : (
                              <span className="rounded-full bg-green-500/10 px-1.5 py-0.5 text-[9px] font-bold text-green-400 uppercase">
                                valido
                              </span>
                            )}

                            <button
                              onClick={() => copyCode(s.discount_code!)}
                              className="rounded-lg border border-border bg-muted/50 p-1 text-muted-foreground hover:text-foreground active:scale-95 transition-colors"
                              title="Copia codice"
                            >
                              {copiedCode === s.discount_code
                                ? <Check className="h-3 w-3 text-green-400" />
                                : <Copy className="h-3 w-3" />}
                            </button>
                          </div>

                          {!s.code_redeemed && (
                            <button
                              onClick={() => markRedeemed(s)}
                              disabled={isRedeeming}
                              className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 px-2 py-1 text-[10px] font-semibold text-muted-foreground hover:border-green-500/40 hover:bg-green-500/10 hover:text-green-400 active:scale-95 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Segna codice come utilizzato dal cliente"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              {isRedeeming ? "…" : "Marcar como usado"}
                            </button>
                          )}

                          {s.code_redeemed && s.code_redeemed_at && (
                            <p className="text-[9px] text-muted-foreground/50">
                              Usato il {formatDate(s.code_redeemed_at)}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
                          <XCircle className="h-3 w-3" /> Nessun codice
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground disabled:opacity-30 active:scale-95 hover:text-foreground"
              >
                <ChevronLeft className="h-3 w-3" /> Precedente
              </button>
              <span className="text-xs text-muted-foreground">{safePage} / {totalPages}</span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground disabled:opacity-30 active:scale-95 hover:text-foreground"
              >
                Successiva <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}

      <p className="pb-2 text-center text-xs text-muted-foreground">
        {totalCount} sessioni totali · 20 per pagina · Codici scadono 24h dopo la creazione
      </p>

      {/* ── Purge confirmation modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {showPurgeModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => !purging && setShowPurgeModal(false)}
          >
            <motion.div
              className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl"
              initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-destructive/30 bg-destructive/10">
                  <Trash2 className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Pulizia cronologia</p>
                  <p className="text-xs text-muted-foreground">Sessioni più vecchie di 7 giorni</p>
                </div>
              </div>

              <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-400">
                <p className="font-semibold mb-1">⚠ Azione irreversibile</p>
                <p>
                  {purgePreviewCount === null
                    ? "Calcolo sessioni da eliminare…"
                    : purgePreviewCount === 0
                    ? "Nessuna sessione da eliminare (tutte entro 7 giorni)."
                    : `${purgePreviewCount} sessioni verranno eliminate definitivamente.`}
                </p>
              </div>

              <p className="mb-5 text-xs text-muted-foreground">
                Prima di procedere, usa il pulsante <strong className="text-foreground">Esporta CSV</strong> per salvare nome, cognome ed email di tutti i clienti in un file Excel.
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => !purging && setShowPurgeModal(false)}
                  disabled={purging}
                  className="flex-1 rounded-xl border border-border bg-muted/30 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground active:scale-95 transition-colors disabled:opacity-50"
                >
                  Annulla
                </button>
                <button
                  onClick={executePurge}
                  disabled={purging || purgePreviewCount === 0}
                  className="flex-1 rounded-xl border border-destructive/40 bg-destructive/10 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/20 active:scale-95 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {purging ? "Eliminando…" : "Elimina"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
