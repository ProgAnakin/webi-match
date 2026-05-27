import { AnimatePresence, motion } from "framer-motion";
import { STORES, getStoreById } from "@/data/stores";
import { daysAgoStr, startOfMonthStr, todayStr } from "./types";

interface DashboardFilterPanelProps {
  open: boolean;
  dateFrom: string;
  dateTo: string;
  filterStore: string | null;
  dateRangeInvalid: boolean;
  isFiltered: boolean;
  filteredCount: number;
  globalTotal: number;
  setDateFrom: (v: string) => void;
  setDateTo: (v: string) => void;
  setFilterStore: (v: string | null) => void;
  clearAll: () => void;
}

const DATE_SHORTCUTS = [
  { label: "Today",      from: () => todayStr(),       to: () => todayStr() },
  { label: "7 days",     from: () => daysAgoStr(6),    to: () => todayStr() },
  { label: "30 days",    from: () => daysAgoStr(29),   to: () => todayStr() },
  { label: "This month", from: () => startOfMonthStr(), to: () => todayStr() },
];

export const DashboardFilterPanel = ({
  open, dateFrom, dateTo, filterStore, dateRangeInvalid, isFiltered,
  filteredCount, globalTotal,
  setDateFrom, setDateTo, setFilterStore, clearAll,
}: DashboardFilterPanelProps) => (
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="overflow-hidden"
      >
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Filter by date
          </p>

          <div className="flex flex-wrap gap-1.5">
            {DATE_SHORTCUTS.map((s) => {
              const fromV = s.from(); const toV = s.to();
              const active = dateFrom === fromV && dateTo === toV;
              return (
                <button
                  key={s.label}
                  onClick={() => { setDateFrom(fromV); setDateTo(toV); }}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className={`w-full rounded-xl border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 ${
                  dateRangeInvalid
                    ? "border-destructive focus:ring-destructive"
                    : "border-border focus:ring-primary"
                }`}
              />
            </div>
          </div>

          {dateRangeInvalid && (
            <p className="text-xs font-medium text-destructive">
              End date must be ≥ start date
            </p>
          )}

          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Store</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setFilterStore(null)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  filterStore === null ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                All
              </button>
              {STORES.map((store) => (
                <button
                  key={store.id}
                  onClick={() => setFilterStore(filterStore === store.id ? null : store.id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    filterStore === store.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {store.shortName}
                </button>
              ))}
            </div>
          </div>

          {isFiltered && (
            <button onClick={clearAll} className="text-xs text-primary underline underline-offset-2">
              Clear all filters
            </button>
          )}

          {isFiltered && !dateRangeInvalid && (
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{filteredCount}</span>
              {filterStore ? ` sessions · ${getStoreById(filterStore)?.shortName ?? filterStore}` : " sessions in this period"}
              {filterStore && (
                <span className="ml-1 text-muted-foreground/60">({globalTotal} total)</span>
              )}
            </p>
          )}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);
