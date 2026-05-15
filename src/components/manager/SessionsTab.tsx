import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Search, X, Copy, Check, Mail, Clock, AlertCircle, XCircle, CheckCircle2, ChevronLeft, ChevronRight, Download, Trash2, Filter, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { products } from "@/data/products";
import { STORES } from "@/data/stores";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import { getCodeTtlMs } from "./EmailTemplateTab";

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
  return (Date.now() - new Date(s.created_at).getTime()) > getCodeTtlMs();
}

function hoursUntilExpiry(s: Session): number | null {
  const msLeft = (new Date(s.created_at).getTime() + getCodeTtlMs()) - Date.now();
  if (msLeft <= 0) return null;
  return Math.ceil(msLeft / 3_600_000);
}

const STATUS_META = {
  enviada:     { label: "INVIATA",         icon: Mail,        cls: "border-green-500/40 bg-green-500/10 text-green-400"       },
  processando: { label: "IN ELABORAZIONE", icon: Clock,       cls: "border-amber-500/40 bg-amber-500/10 text-amber-400"       },
  sem_email:   { label: "SENZA EMAIL",     icon: AlertCircle, cls: "border-orange-500/40 bg-orange-500/10 text-orange-400"    },
  falhou:      { label: "FALLITA",         icon: XCircle,     cls: "border-destructive/40 bg-destructive/10 text-destructive" },
};

interface SessionsTabProps {
  storeId: string;
  isGlobal: boolean;
}

// ── Skeleton loader ────────────────────────────────────────────────────────────
function SessionSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-4 animate-pulse">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-muted/50" />
              <div className="h-3 w-48 rounded bg-muted/40" />
              <div className="h-3 w-24 rounded bg-muted/30" />
            </div>
            <div className="space-y-2">
              <div className="h-6 w-20 rounded-full bg-muted/50" />
              <div className="h-6 w-28 rounded-lg bg-muted/40" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export const SessionsTab = ({ storeId, isGlobal }: SessionsTabProps) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [kpiData, setKpiData] = useState<Pick<Session, "id" | "email_sent" | "discount_code" | "created_at" | "code_redeemed">[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [negadoCount, setNegadoCount] = useState(0);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purging, setPurging] = useState(false);
  const [purgePreviewCount, setPurgePreviewCount] = useState<number | null>(null);

  // ── Advanced filters ────────────────────────────────────────────────────────
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterProductId, setFilterProductId] = useState("");
  const [filterMatchMin, setFilterMatchMin] = useState("");
  const [filterMatchMax, setFilterMatchMax] = useState("");

  const PAGE_SIZE = 20;
  const [currentPage, setCurrentPage] = useState(1);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchKpiData = useCallback(async () => {
    let q = supabase
      .from("quiz_sessions")
      .select("id, email_sent, discount_code, created_at, code_redeemed");
    if (!isGlobal) q = q.eq("store_id", storeId);
    const { data } = await q;
    setKpiData((data ?? []) as typeof kpiData);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, isGlobal]);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    const from = (currentPage - 1) * PAGE_SIZE;

    let query = supabase
      .from("quiz_sessions")
      .select("id, email, nome, cognome, matched_product_id, match_percent, email_sent, discount_code, created_at, store_id, code_redeemed, code_redeemed_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (!isGlobal) query = query.eq("store_id", storeId);
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.trim()
        .replace(/\\/g, "\\\\")
        .replace(/%/g, "\\%")
        .replace(/_/g, "\\_");
      query = query.or(`email.ilike.%${q}%,discount_code.ilike.%${q}%,nome.ilike.%${q}%,cognome.ilike.%${q}%`);
    }
    // Advanced filters
    if (filterDateFrom) query = query.gte("created_at", new Date(filterDateFrom).toISOString());
    if (filterDateTo) {
      const to = new Date(filterDateTo);
      to.setHours(23, 59, 59, 999);
      query = query.lte("created_at", to.toISOString());
    }
    if (filterProductId) query = query.eq("matched_product_id", filterProductId);
    if (filterMatchMin) query = query.gte("match_percent", parseInt(filterMatchMin, 10));
    if (filterMatchMax) query = query.lte("match_percent", parseInt(filterMatchMax, 10));

    const { data, count } = await query;
    setSessions((data ?? []) as Session[]);
    setTotalCount(count ?? 0);
    setLoading(false);
  }, [storeId, isGlobal, currentPage, debouncedSearch, filterDateFrom, filterDateTo, filterProductId, filterMatchMin, filterMatchMax]);

  const fetchNegado = useCallback(async () => {
    const [shownRes, claimedRes] = await Promise.all([
      supabase.from("quiz_funnel_events").select("*", { count: "exact", head: true }).eq("event_type", "result_shown"),
      supabase.from("quiz_funnel_events").select("*", { count: "exact", head: true }).eq("event_type", "claimed"),
    ]);
    const negado = (shownRes.count ?? 0) - (claimedRes.count ?? 0);
    setNegadoCount(Math.max(0, negado));
  }, []);

  // #6 — Real-time subscription
  useEffect(() => {
    const ch = supabase
      .channel("sessions-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "quiz_sessions" }, () => {
        fetchSessions();
        fetchKpiData();
      })
      .subscribe();
    channelRef.current = ch;
    return () => { supabase.removeChannel(ch); };
  }, [fetchSessions, fetchKpiData]);

  useEffect(() => {
    fetchKpiData();
    fetchNegado();
  }, [fetchKpiData, fetchNegado]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [debouncedSearch, statusFilter, filterDateFrom, filterDateTo, filterProductId, filterMatchMin, filterMatchMax]);

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
      toast.success("Codice copiato!");
    } catch { /* clipboard unavailable */ }
  };

  const markRedeemed = async (s: Session) => {
    if (redeemingId) return;
    setRedeemingId(s.id);
    const { data: rowsUpdated, error } = await supabase.rpc("mark_code_redeemed", { p_session_id: s.id } as never);
    if (!error && (rowsUpdated as number) > 0) {
      setSessions((prev) =>
        prev.map((row) =>
          row.id === s.id
            ? { ...row, code_redeemed: true, code_redeemed_at: new Date().toISOString() }
            : row
        )
      );
      toast.success("Codice segnato come usato.");
    } else if (!error && (rowsUpdated as number) === 0) {
      toast.error("0 righe aggiornate — controlla la funzione SQL.");
    } else if (error) {
      toast.error(`Errore: ${error.message}`);
    }
    setRedeemingId(null);
  };

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
      s.nome ?? "", s.cognome ?? "", s.email,
      productName(s.matched_product_id), s.match_percent,
      storeName(s.store_id), formatDate(s.created_at),
      s.discount_code ?? "",
      s.code_redeemed ? "usato" : isCodeExpired(s) ? "scaduto" : s.discount_code ? "valido" : "sem codice",
      s.code_redeemed_at ? formatDate(s.code_redeemed_at) : "",
    ]);

    const csvContent = [headers, ...csvRows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `webi-match-sessioni-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`${rows.length} sessioni esportate in CSV.`);
    setExporting(false);
  }, [storeId, isGlobal]);

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

  const executePurge = useCallback(async () => {
    setPurging(true);
    const { data } = await supabase.rpc("purge_sessions_older_than", { p_days: 7 } as never);
    setPurging(false);
    setShowPurgeModal(false);
    const deleted = (data as number) ?? 0;
    toast.success(`${deleted} sessioni eliminate con successo.`);
    fetchSessions();
    fetchKpiData();
    fetchNegado();
  }, [fetchSessions, fetchKpiData, fetchNegado]);

  const filtered = statusFilter === "all"
    ? sessions
    : sessions.filter((s) => getSessionStatus(s) === statusFilter);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage   = Math.min(currentPage, totalPages);
  const paginated  = filtered;

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
    (s) => (Date.now() - new Date(s.created_at).getTime()) > getCodeTtlMs()
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

  const hasAdvancedFilter = !!(filterDateFrom || filterDateTo || filterProductId || filterMatchMin || filterMatchMax);

  const clearAdvanced = () => {
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterProductId("");
    setFilterMatchMin("");
    setFilterMatchMax("");
  };

  const allProducts = products.map((p) => ({ id: p.id, name: p.name }));

  return (
    <div className="space-y-5">

      {/* Summary KPIs */}
      <motion.div
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      >
        <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{counts.enviada}</p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/70">Email inviate</p>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">{counts.processando}</p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/70">In elaborazione</p>
        </div>
        <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 text-center">
          <p className="text-2xl font-bold text-orange-400">{counts.sem_email}</p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/70">Senza email</p>
        </div>
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-center">
          <p className="text-2xl font-bold text-destructive">{counts.falhou}</p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/70">Fallite</p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/20 p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{negadoCount}</p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/70">Match negato</p>
          <p className="mt-0.5 text-[9px] text-foreground/40">({localNegado} da lista)</p>
        </div>
        <div className={`rounded-2xl border p-4 text-center ${redemptionBorderBg}`}>
          <p className={`text-2xl font-bold ${redemptionColor}`}>{redemptionUsed}/{redemptionTotal}</p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Codici usati</p>
          <p className={`mt-0.5 text-[9px] font-semibold ${redemptionColor}`}>{redemptionPct}%</p>
        </div>
      </motion.div>

      {expiredReusable > 0 && (
        <motion.div
          className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-muted-foreground"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
          💡 <strong className="text-foreground">{expiredReusable}</strong> codici scaduti (più di 24h) possono essere riutilizzati manualmente per nuovi clienti.
        </motion.div>
      )}

      {/* Search + advanced filter toggle */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
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
          <button
            onClick={() => setShowAdvanced((v) => !v)}
            title="Filtri avanzati"
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
              showAdvanced || hasAdvancedFilter
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground"
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            {hasAdvancedFilter ? "Filtri attivi" : "Filtri"}
          </button>
        </div>

        {/* Advanced filters panel */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" /> Filtri avanzati
                  </p>
                  {hasAdvancedFilter && (
                    <button onClick={clearAdvanced} className="text-[10px] text-primary hover:underline">
                      Azzera filtri
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-muted-foreground mb-1">Data da</label>
                    <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)}
                      className="w-full rounded-lg border border-border bg-muted/30 px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-muted-foreground mb-1">Data a</label>
                    <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)}
                      className="w-full rounded-lg border border-border bg-muted/30 px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] text-muted-foreground mb-1">Prodotto</label>
                    <select value={filterProductId} onChange={(e) => setFilterProductId(e.target.value)}
                      className="w-full rounded-lg border border-border bg-muted/30 px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                      <option value="">Tutti i prodotti</option>
                      {allProducts.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-muted-foreground mb-1">Match % min</label>
                    <input type="number" min={0} max={100} value={filterMatchMin} onChange={(e) => setFilterMatchMin(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-lg border border-border bg-muted/30 px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-muted-foreground mb-1">Match % max</label>
                    <input type="number" min={0} max={100} value={filterMatchMax} onChange={(e) => setFilterMatchMax(e.target.value)}
                      placeholder="100"
                      className="w-full rounded-lg border border-border bg-muted/30 px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
              : f === "enviada"     ? `Inviata (${counts.enviada})`
              : f === "processando" ? `Elaborazione (${counts.processando})`
              : f === "sem_email"   ? `Senza email (${counts.sem_email})`
              :                       `Fallita (${counts.falhou})`}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={exportToCSV}
            disabled={exporting}
            className="flex min-h-[44px] items-center gap-1 rounded-xl border border-border bg-card px-3 text-xs text-foreground/70 hover:border-green-500/40 hover:bg-green-500/10 hover:text-green-400 active:scale-95 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            title="Esporta tutte le sessioni in CSV"
          >
            <Download className="h-3.5 w-3.5" /> {exporting ? "…" : "Esporta CSV"}
          </button>

          <button
            onClick={openPurgeModal}
            className="flex min-h-[44px] items-center gap-1 rounded-xl border border-border bg-card px-3 text-xs text-foreground/70 hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive active:scale-95 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            title="Elimina sessioni più vecchie di 7 giorni"
          >
            <Trash2 className="h-3.5 w-3.5" /> Pulisci (7gg)
          </button>

          <button
            onClick={() => { fetchSessions(); fetchKpiData(); fetchNegado(); }}
            className="flex min-h-[44px] items-center gap-1 rounded-xl border border-border bg-card px-3 text-xs text-foreground/70 active:scale-95 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Aggiorna
          </button>
        </div>
      </div>

      {/* Session list */}
      {loading ? (
        <SessionSkeleton />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-muted/20 py-12 text-center">
          <p className="text-2xl mb-2">📭</p>
          <p className="text-sm font-medium text-foreground">
            {search || hasAdvancedFilter ? "Nessun risultato trovato" : "Nessuna sessione"}
          </p>
          {(search || hasAdvancedFilter) && (
            <p className="text-xs text-muted-foreground mt-1">Prova con criteri diversi.</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {totalCount} sessioni{search ? ` (ricerca: "${search}")` : ""}
              {hasAdvancedFilter && " · filtri attivi"}
              {statusFilter !== "all" && ` · filtro: ${statusFilter}`}
              {totalPages > 1 && ` · pagina ${safePage} di ${totalPages}`}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground disabled:opacity-30 active:scale-95 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="min-w-[3rem] text-center text-xs font-semibold text-foreground">
                  {safePage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground disabled:opacity-30 active:scale-95 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <ChevronRight className="h-4 w-4" />
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
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.15), duration: 0.2 }}
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
                              <span className="rounded-full bg-green-500/10 px-1.5 py-0.5 text-[9px] font-bold text-green-400 uppercase">usato</span>
                            ) : expired ? (
                              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground uppercase">scaduto</span>
                            ) : expiringSoon ? (
                              <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 uppercase">
                                scade in {hrsLeft}h
                              </span>
                            ) : (
                              <span className="rounded-full bg-green-500/10 px-1.5 py-0.5 text-[9px] font-bold text-green-400 uppercase">valido</span>
                            )}

                            <button
                              onClick={() => copyCode(s.discount_code!)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted/50 text-foreground/70 hover:text-foreground active:scale-95 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                              title="Copia codice"
                            >
                              {copiedCode === s.discount_code
                                ? <Check className="h-3.5 w-3.5 text-green-400" />
                                : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>

                          {!s.code_redeemed && (
                            <button
                              onClick={() => markRedeemed(s)}
                              disabled={isRedeeming}
                              className="flex min-h-[32px] items-center gap-1 rounded-lg border border-border bg-muted/30 px-2 py-1 text-[10px] font-semibold text-foreground/70 hover:border-green-500/40 hover:bg-green-500/10 hover:text-green-400 active:scale-95 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                              title="Segna codice come utilizzato dal cliente"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {isRedeeming ? "…" : "Segna come usato"}
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
                className="flex min-h-[44px] items-center gap-1 rounded-xl border border-border bg-card px-3 text-xs text-foreground/70 disabled:opacity-30 active:scale-95 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Precedente
              </button>
              <span className="text-xs text-foreground/70">{safePage} / {totalPages}</span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="flex min-h-[44px] items-center gap-1 rounded-xl border border-border bg-card px-3 text-xs text-foreground/70 disabled:opacity-30 active:scale-95 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Successiva <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      <p className="pb-2 text-center text-xs text-muted-foreground">
        {totalCount} sessioni totali · 20 per pagina · Codici scadono 24h dopo la creazione · Aggiornamento live ⚡
      </p>

      {/* ── Purge confirmation modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {showPurgeModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => !purging && setShowPurgeModal(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="purge-modal-title"
              className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl"
              initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-destructive/30 bg-destructive/10">
                  <Trash2 className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p id="purge-modal-title" className="text-sm font-bold text-foreground">Pulizia cronologia</p>
                  <p className="text-xs text-foreground/70">Sessioni più vecchie di 7 giorni</p>
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

              <p className="mb-5 text-xs text-foreground/70">
                Prima di procedere, usa il pulsante <strong className="text-foreground">Esporta CSV</strong> per salvare tutti i dati clienti.
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => !purging && setShowPurgeModal(false)}
                  disabled={purging}
                  className="flex-1 min-h-[44px] rounded-xl border border-border bg-muted/30 py-2.5 text-sm font-semibold text-foreground/70 hover:text-foreground active:scale-95 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Annulla
                </button>
                <button
                  onClick={executePurge}
                  disabled={purging || purgePreviewCount === 0}
                  className="flex-1 min-h-[44px] rounded-xl border border-destructive/40 bg-destructive/10 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/20 active:scale-95 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
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
