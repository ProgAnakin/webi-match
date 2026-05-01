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
  // Code generated but Brevo failed (edge function ran, SMTP step failed)
  if (s.discount_code) return "sem_email";
  // Edge function never ran or failed before code generation
  return "falhou";
}

function isCodeExpired(s: Session): boolean {
  return (Date.now() - new Date(s.created_at).getTime()) > 24 * 3_600_000;
}

/** Returns hours left until expiry (based on 24h from created_at). Returns null if already expired. */
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
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [negadoCount, setNegadoCount] = useState(0);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("quiz_sessions")
      .select("id, email, nome, cognome, matched_product_id, match_percent, email_sent, discount_code, created_at, store_id, code_redeemed, code_redeemed_at")
      .order("created_at", { ascending: false })
      .limit(300);

    if (!isGlobal) query = query.eq("store_id", storeId);

    const { data } = await query;
    setSessions((data ?? []) as Session[]);
    setLoading(false);
  }, [storeId, isGlobal]);

  const fetchNegado = useCallback(async () => {
    // NOTE: negadoCount uses quiz_funnel_events which may span a different time window
    // than the session list (300-session limit). See localNegado below for a session-derived metric.
    const [shownRes, claimedRes] = await Promise.all([
      supabase.from("quiz_funnel_events").select("*", { count: "exact", head: true }).eq("event_type", "result_shown"),
      supabase.from("quiz_funnel_events").select("*", { count: "exact", head: true }).eq("event_type", "claimed"),
    ]);
    const negado = (shownRes.count ?? 0) - (claimedRes.count ?? 0);
    setNegadoCount(Math.max(0, negado));
  }, []);

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
    const matchStatus = statusFilter === "all" || getSessionStatus(s) === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    all:         sessions.length,
    enviada:     sessions.filter((s) => getSessionStatus(s) === "enviada").length,
    processando: sessions.filter((s) => getSessionStatus(s) === "processando").length,
    sem_email:   sessions.filter((s) => getSessionStatus(s) === "sem_email").length,
    falhou:      sessions.filter((s) => getSessionStatus(s) === "falhou").length,
  };

  const expiredReusable = sessions.filter(
    (s) => isCodeExpired(s) && s.discount_code && !s.code_redeemed
  ).length;

  // Redemption rate KPI
  const sessionsWithCode = sessions.filter((s) => s.discount_code !== null);
  const sessionsRedeemed = sessions.filter((s) => s.code_redeemed === true);
  const redemptionTotal = sessionsWithCode.length;
  const redemptionUsed = sessionsRedeemed.length;
  const redemptionPct = redemptionTotal > 0 ? Math.round((redemptionUsed / redemptionTotal) * 100) : 0;
  const redemptionColor =
    redemptionPct > 50 ? "text-green-400" :
    redemptionPct >= 20 ? "text-amber-400" :
    "text-muted-foreground";
  const redemptionBorderBg =
    redemptionPct > 50 ? "border-green-500/20 bg-green-500/5" :
    redemptionPct >= 20 ? "border-amber-500/20 bg-amber-500/5" :
    "border-border bg-muted/20";

  // Local negado derived from current session list (may differ from funnel-event count)
  // Sessions where the user didn't proceed to claim (no email_sent and no discount_code)
  const localNegado = sessions.length - sessions.filter((s) => s.email_sent || s.discount_code).length;

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
          {/* Local metric: sessions where user declined before claiming (may differ from funnel count above) */}
          <p className="mt-0.5 text-[9px] text-muted-foreground/50">({localNegado} da lista)</p>
        </div>
        {/* Redemption rate KPI */}
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
        <div className="rounded-2xl border border-border bg-muted/20 py-12 text-center">
          <p className="text-2xl mb-2">📭</p>
          <p className="text-sm font-medium text-foreground">
            {search ? "Nessun risultato trovato" : "Nessuna sessione"}
          </p>
          {search && <p className="text-xs text-muted-foreground mt-1">Prova con un'altra email o codice.</p>}
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

                          {/* Mark as redeemed button — only shown if not yet redeemed */}
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
