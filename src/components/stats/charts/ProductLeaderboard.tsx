import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import type { ProductStat } from "../types";

const PRODUCT_PAGE_SIZE = 8;
const MEDALS = ["🥇", "🥈", "🥉"];

interface ProductLeaderboardProps {
  products: ProductStat[];
  page: number;
  isFiltered: boolean;
  onPageChange: (page: number) => void;
  onProductClick: (name: string) => void;
}

export const ProductLeaderboard = ({
  products, page, isFiltered, onPageChange, onProductClick,
}: ProductLeaderboardProps) => {
  const totalPages = Math.ceil(products.length / PRODUCT_PAGE_SIZE);
  const pagedProducts = products.slice(page * PRODUCT_PAGE_SIZE, (page + 1) * PRODUCT_PAGE_SIZE);

  return (
    <motion.div
      className="rounded-2xl border border-border bg-card p-6 shadow-card"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
    >
      <div className="mb-1 flex items-center gap-2">
        <h2 className="font-bold text-foreground">🏆 Most claimed products</h2>
        <TrendingUp className="h-4 w-4 text-primary" />
      </div>
      <p className="mb-4 text-[11px] text-muted-foreground">
        Each session = one user who completed the claim · click to filter sessions
      </p>

      {products.length === 0 ? (
        <div className="text-center py-3">
          <p className="text-sm font-medium text-foreground">
            {isFiltered ? "No products in the selected period" : "No matches yet"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isFiltered ? "Expand the date range to see data." : "The most matched products will appear here."}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3" style={{ minHeight: `${PRODUCT_PAGE_SIZE * 38}px` }}>
            {pagedProducts.map((p, i) => {
              const globalIdx = page * PRODUCT_PAGE_SIZE + i;
              return (
                <div
                  key={p.id}
                  className="cursor-pointer rounded-lg p-1 transition-colors hover:bg-primary/10"
                  onClick={() => onProductClick(p.name)}
                >
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="truncate pr-2 font-medium text-foreground">
                      {MEDALS[globalIdx] ?? "  "} {p.name}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      {p.avgMatch !== undefined && (
                        <span className="text-muted-foreground">⌀{p.avgMatch}%</span>
                      )}
                      <span className="font-bold text-primary">{p.count}x · {p.percent}%</span>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full gradient-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${p.percent}%` }}
                      transition={{ duration: 0.6, delay: 0.3 + i * 0.05 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => onPageChange(Math.max(0, page - 1))}
                disabled={page === 0}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground disabled:opacity-30 active:scale-95"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, idx) => (
                <button
                  key={idx}
                  onClick={() => onPageChange(idx)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-semibold active:scale-95 ${
                    idx === page
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-muted text-muted-foreground"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
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
  );
};
