import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { FunnelCounts, QuizSession } from "./types";

const FETCH_LIMIT = 5000;
const REFRESH_DEBOUNCE_MS = 3000;

interface DashboardDataOptions {
  dateFrom: string;
  dateTo: string;
  filterStore: string | null;
  dateRangeInvalid: boolean;
}

/**
 * Pulls quiz_sessions (server-side filtered by date + store) and the
 * three funnel event counts in parallel. The manual refresh is
 * debounced so a frantic click on Refresh doesn't hammer Supabase.
 */
export const useDashboardData = ({ dateFrom, dateTo, filterStore, dateRangeInvalid }: DashboardDataOptions) => {
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [funnel, setFunnel] = useState<FunnelCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const lastFetchRef = useRef<number>(0);

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual && Date.now() - lastFetchRef.current < REFRESH_DEBOUNCE_MS) return;
    lastFetchRef.current = Date.now();
    setLoading(true);
    setHasError(false);

    if (dateRangeInvalid) { setLoading(false); return; }

    let query = supabase
      .from("quiz_sessions")
      .select("id, email, nome, cognome, matched_product_id, match_percent, created_at, store_id, email_sent, discount_code, code_redeemed")
      .order("created_at", { ascending: false })
      .limit(FETCH_LIMIT);

    if (dateFrom) query = query.gte("created_at", dateFrom);
    if (dateTo)   query = query.lte("created_at", dateTo + "T23:59:59");
    if (filterStore) query = query.eq("store_id", filterStore);

    const { data, error } = await query;
    if (error) setHasError(true);
    else setSessions((data ?? []) as QuizSession[]);

    // Funnel counts are global, not date-filtered. Wrapped so a network
    // rejection here can't abort the dashboard and leave it stuck on
    // the loading spinner.
    try {
      const [startedRes, resultRes, claimedRes] = await Promise.all([
        supabase.from("quiz_funnel_events").select("*", { count: "exact", head: true }).eq("event_type", "quiz_started"),
        supabase.from("quiz_funnel_events").select("*", { count: "exact", head: true }).eq("event_type", "result_shown"),
        supabase.from("quiz_funnel_events").select("*", { count: "exact", head: true }).eq("event_type", "claimed"),
      ]);
      setFunnel({
        started:     startedRes.count ?? 0,
        resultShown: resultRes.count  ?? 0,
        claimed:     claimedRes.count ?? 0,
      });
    } catch (err) {
      console.error("[webi-match] funnel counts fetch failed:", err);
    }

    setLoading(false);
  }, [dateFrom, dateTo, filterStore, dateRangeInvalid]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { sessions, funnel, loading, hasError, refetch: fetchData };
};
