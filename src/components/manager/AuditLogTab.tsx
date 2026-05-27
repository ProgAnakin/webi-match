import { RotateCcw } from "lucide-react";
import type { Product } from "@/data/products";
import { auditStoreName, formatAuditDate, type AuditLogEntry } from "./managerDashboardUtils";

interface AuditLogTabProps {
  loading: boolean;
  error: boolean;
  entries: AuditLogEntry[];
  catalogProducts: Product[];
  onRefresh: () => void;
}

export const AuditLogTab = ({
  loading,
  error,
  entries,
  catalogProducts,
  onRefresh,
}: AuditLogTabProps) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-semibold text-foreground">Catalog change history</h2>
      <button
        onClick={onRefresh}
        className="flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground active:scale-95"
      >
        <RotateCcw className="h-3 w-3" /> Refresh
      </button>
    </div>

    {loading ? (
      <div className="py-16 text-center text-muted-foreground text-sm">Loading history…</div>
    ) : error || entries.length === 0 ? (
      <div className="rounded-2xl border border-border bg-muted/20 py-12 text-center">
        <p className="text-2xl mb-2">📋</p>
        <p className="text-sm font-medium text-foreground">No history available</p>
        <p className="text-xs text-muted-foreground mt-1">Future changes will appear here.</p>
      </div>
    ) : (
      <div className="space-y-2">
        {entries.map((entry) => {
          const prodName = entry.product_id
            ? (catalogProducts.find((p) => p.id === entry.product_id)?.name ?? entry.product_id)
            : "—";
          const isActivated = entry.new_active === true;
          return (
            <div
              key={entry.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
            >
              <span className={`shrink-0 text-sm font-bold ${isActivated ? "text-green-400" : "text-destructive"}`}>
                {isActivated ? "✓" : "✗"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{prodName}</p>
                <p className="text-xs text-muted-foreground">
                  {isActivated ? "Activated" : "Deactivated"}
                  {entry.store_id && <span className="ml-1.5">· {auditStoreName(entry.store_id)}</span>}
                </p>
              </div>
              <p className="shrink-0 text-[10px] text-muted-foreground/60">{formatAuditDate(entry.created_at)}</p>
            </div>
          );
        })}
      </div>
    )}
  </div>
);
