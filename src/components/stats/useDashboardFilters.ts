import { useSearchParams } from "react-router-dom";

/**
 * URL-persisted filters for the analytics dashboard (date range + store).
 * Persisting in the query string means a manager can bookmark or share a
 * filtered view, and a refresh doesn't lose state. `dateRangeInvalid` is
 * computed here so every consumer sees the same boolean.
 */
export const useDashboardFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dateFrom = searchParams.get("from") ?? "";
  const dateTo = searchParams.get("to") ?? "";
  const filterStore = searchParams.get("store") ?? null;

  const update = (key: string, value: string | null) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      return next;
    }, { replace: true });
  };

  const setDateFrom   = (v: string)        => update("from", v);
  const setDateTo     = (v: string)        => update("to", v);
  const setFilterStore = (v: string | null) => update("store", v);

  const clearAll = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("from");
      next.delete("to");
      next.delete("store");
      return next;
    }, { replace: true });
  };

  const isFiltered = dateFrom !== "" || dateTo !== "" || filterStore !== null;
  const dateRangeInvalid = !!(dateFrom && dateTo && dateTo < dateFrom);

  return {
    dateFrom, dateTo, filterStore,
    setDateFrom, setDateTo, setFilterStore,
    clearAll,
    isFiltered, dateRangeInvalid,
  };
};
