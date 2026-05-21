import { useState, useMemo } from "react";
import { Search, ChevronRight } from "lucide-react";
import type { ProductGuide, GuideLang } from "./types";
import { localisedGuide } from "./types";

interface ProductGuideListProps {
  guides: ProductGuide[];
  lang: GuideLang;
  onSelect: (productId: string) => void;
}

export const ProductGuideList = ({ guides, lang, onSelect }: ProductGuideListProps) => {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return guides;
    return guides.filter((g) => g.product_name.toLowerCase().includes(q));
  }, [guides, query]);

  if (guides.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-muted/20 py-16 text-center">
        <p className="mb-2 text-3xl">📚</p>
        <p className="text-sm font-medium text-foreground">No guides yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          A manager hasn't published any product guides yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a product…"
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map((g) => {
          const { description } = localisedGuide(g, lang);
          return (
            <button
              key={g.product_id}
              onClick={() => onSelect(g.product_id)}
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:border-sky-500/40 active:scale-[0.99]"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{g.product_name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {description.trim() || "No description yet"}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-xs text-muted-foreground">
            No product matches "{query}".
          </p>
        )}
      </div>
    </div>
  );
};
