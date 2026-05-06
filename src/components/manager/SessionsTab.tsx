import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Search, X, Copy, Check, Mail, Clock, AlertCircle, XCircle, CheckCircle2 } from "lucide-react";
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

type StatusFilter = "all" | "inviata" | "elaborazione" | "fallita";

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

function getSessionStatus(s: Session): "inviata" | "elaborazione" | "fallita" {
  if (s.email_sent) return "inviata";
  const ageMin = (Date.now() - new Date(s.created_at).getTime()) / 60_000;
  return ageMin < 5 ? "elaborazione" : "fallita";
}

function isCodeExpired(s: Session): boolean {
  return (Date.now() - new Date(s.created_at).getTime()) > 24 * 3_600_000;
}

const STATUS_META = {
  inviata:      { label: "INVIATA",      icon: Mail,        cls: "border-green-500/40 bg-green-500/10 text-green-400" },
  elaborazione: { label: "ELABORAZIONE", icon: Clock,       cls: "border-amber-500/40 bg-amber-500/10 text-amber-400" },
  fallita:      { label: "FALLITA",      icon: AlertCircle, cls: "border-destructive/40 bg-destructive/10 text-destructive" },
};

interface SessionsTabProps {
  storeId: string;
  isGlobal: boolean;
}

export const SessionsTab = ({ storeId, isGlobal }: SessionsTabProps) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [negadoCount, setNegadoCount] = useState(0);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    let query = supabase
      .from("quiz_sessions")
      .select("id, email, nome, cognome, matched_product_id, match_percent, email_sent, discount_code, created_at, store_id, code_redeemed, code_redeemed_at")
      .order("created_at", { ascending: false })
      .limit(300);

    if (!isGlobal) query = query.eq("store_id", storeId);

    const { data, error } = await query;
    if (error) {
      setFetchError("Errore nel caricamento delle sessioni. Verifica la connessione.");
    } else {
      setSessions((data ?? []) as Session[]);
    }
    setLoading(false);
  }, [storeId, isGlobal]);

  const fetchNegado = useCallback(async () => {
    let shownQ = supabase.from("quiz_funnel_events").select("*", { count: "exact", head: true }).eq("event_type", "result_shown");
    let claimedQ = supabase.from("quiz_funnel_events").select("*", { count: "exact", head: true }).eq("event_type", "claimed");
    if (!isGlobal) {
      shownQ   = shownQ.eq("store_id", storeId);
      claimedQ = claimedQ.eq("store_id", storeId);
    }
    const [shownRes, claimedRes] = await Promise.all([shownQ, claimedQ]);
    const negado = (shownRes.count ?? 0) - (claimedRes.count ?? 0);
    setNegadoCount(Math.max(0, negado));
  }, [storeId, isGlobal]);

  useEffect(() => {
    fetchSessions();
    fetchNegado();
  }, [fetchSessions, fetchNegado]);

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch { /* clipboard unavailable */ }
  };

  const markRedeemed = async (s: Session) => {
    if (redeemingId) return;
    setRedeemingId(s.id);
    const { error } = await supabase
      .from("quiz_sessions")
      .update({
        code_redeemed: true,
        code_redeemed_at: new Date().toISOString(),
      })
      .eq("id", s.id);

    if (!error) {
      setSessions((prev) =>
        prev.map((row) =>
          row.id === s.id
            ? { ...row, code_redeemed: true, code_redeemed_at: new Date().toISOString() }
            : row
        )
      );
    }
    setRedeemingId(null);
  };

  const filtered = sessions.filter((s) => {
    const q = search.toLowerCase().trim();
    const matchSearch = !q ||
      s.email.toLowerCase().includes(q) ||
      (s.discount_code?.toLowerCase().includes(q) ?? false) ||
      `${s.nome ?? ""} ${s.cognome ?? ""}`.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || getSessionStatus(s) === (statusFilter as "inviata" | "elaborazione" | "fallita");
    return matchSearch && matchStatus;
  });

  const counts = {
    all:          sessions.length,
    inviata:      sessions.filter((s) => getSessionStatus(s) === "inviata").length,
    elaborazione: sessions.filter((s) => getSessionStatus(s) === "elaborazione").length,
    fallita:      sessions.filter((s) => getSessionStatus(s) === "fallita").length,
  };

  const expiredReusable = sessions.filter(
    (s) => isCodeExpired(s) && s.discount_code && !s.code_redeemed
  ).length;

  return (
    <div className="space-y-5">

      {/* Summary KPIs */}
      <motion.div
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      >
        <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{counts.enviada}</p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Email inviate</p>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">{counts.elaborazione}</p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">In elaborazione</p>
        </div>
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-center">
          <p className="text-2xl font-bold text-destructive">{counts.fallita}</p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Fallite</p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/20 p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{negadoCount}</p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Non conversioni</p>
        </div>
      </motion.div>

      {/* Fetch error */}
      <AnimatePresence>
        {fetchError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {fetchError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expired codes info */}
      {expiredReusable > 0 && (
        <motion.div
          className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-muted-foreground"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
          💡 <strong className="text-foreground">{expiredReusable}</strong> codici scaduti (più di 24h) possono essere riutilizzati manualmente per nuovi clienti — copia il codice e consegnalo al consulente.
        </motion.div>
      )}

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

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {(["all", "inviata", "elaborazione", "fallita"] as StatusFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              statusFilter === f
                ? f === "all" ? "bg-primary text-primary-foreground"
                  : f === "inviata" ? "bg-green-500/20 text-green-400 border border-green-500/40"
                  : f === "elaborazione" ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                  : "bg-destructive/20 text-destructive border border-destructive/40"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {f === "all" ? `Tutti (${counts.all})`
              : f === "inviata" ? `Inviata (${counts.inviata})`
              : f === "elaborazione" ? `In elaborazione (${counts.elaborazione})`
              : `Fallita (${counts.fallita})`}
          </button>
        ))}
        <button
          onClick={() => { fetchSessions(); fetchNegado(); }}
          className="ml-auto flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground active:scale-95"
        >
          <RefreshCw className="h-3 w-3" /> Aggiorna
        </button>
      </div>

      {/* Session list */}
      {loading ? (
        <div className="py-16 text-center text-muted-foreground text-sm">Caricamento sessioni…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-muted/20 py-12 text-center px-6 space-y-2">
          <p className="text-2xl">📭</p>
          <p className="text-sm font-medium text-foreground">
            {search ? "Nessun risultato trovato" : "Nessuna sessione completata"}
          </p>
          {search
            ? <p className="text-xs text-muted-foreground">Prova con un'altra email o codice.</p>
            : negadoCount > 0
              ? <p className="text-xs text-muted-foreground leading-relaxed">
                  {negadoCount} visitatori hanno visto il risultato ma non hanno lasciato la loro email — sono conteggiati come "Non conversioni".
                </p>
              : null
          }
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {filtered.length} sessioni{search ? ` (filtro: "${search}")` : ""}
          </p>
          <AnimatePresence initial={false}>
            {filtered.map((s, i) => {
              const status = getSessionStatus(s);
              const meta = STATUS_META[status];
              const expired = isCodeExpired(s);
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
                    {/* Left: session info */}
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

                    {/* Right: status + code */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {/* Status badge */}
                      <span className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${meta.cls}`}>
                        <StatusIcon className="h-3 w-3" />
                        {meta.label}
                      </span>

                      {/* Discount code */}
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

                          {/* Mark as redeemed button — only shown if not yet redeemed */}
                          {!s.code_redeemed && (
                            <button
                              onClick={() => markRedeemed(s)}
                              disabled={isRedeeming}
                              className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 px-2 py-1 text-[10px] font-semibold text-muted-foreground hover:border-green-500/40 hover:bg-green-500/10 hover:text-green-400 active:scale-95 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Segna codice come utilizzato dal cliente"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              {isRedeeming ? "…" : "Segna come usato"}
                            </button>
                          )}

                          {/* Redemption timestamp */}
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
        </div>
      )}

      <p className="pb-2 text-center text-xs text-muted-foreground">
        Mostra le ultime 300 sessioni · I codici scadono 24h dopo la creazione
      </p>
    </div>
  );
};
