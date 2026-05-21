import { useState, useEffect, useCallback } from "react";
import { LogOut, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { ProductGuide, GuideLang } from "./types";
import { ProductGuideList } from "./ProductGuideList";
import { ProductGuideDetail } from "./ProductGuideDetail";

interface ConsulenteDashboardProps {
  onLogout: () => void;
}

// Read-only consultant training zone. Sky/blue accent throughout — deliberately
// distinct from the orange /manager dashboard so staff never confuse the two.
export const ConsulenteDashboard = ({ onLogout }: ConsulenteDashboardProps) => {
  const [guides, setGuides] = useState<ProductGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lang, setLang] = useState<GuideLang>("it");

  const fetchGuides = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("product_guides")
      .select("*")
      .order("product_name", { ascending: true });
    setGuides((data ?? []) as ProductGuide[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchGuides(); }, [fetchGuides]);

  const selected = guides.find((g) => g.product_id === selectedId) ?? null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold text-foreground">Consultant Training</h1>
              <p className="text-[11px] text-muted-foreground">Product knowledge base</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <div className="flex overflow-hidden rounded-xl border border-border">
              {(["it", "en"] as GuideLang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-3 py-1.5 text-xs font-bold uppercase transition-colors ${
                    lang === l
                      ? "bg-sky-500 text-white"
                      : "bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            <button
              onClick={onLogout}
              title="Sign out"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground active:scale-95"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-2xl px-4 py-5">
        {loading ? (
          <div className="py-20 text-center text-sm text-muted-foreground">Loading guides…</div>
        ) : selected ? (
          <ProductGuideDetail
            guide={selected}
            lang={lang}
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <ProductGuideList
            guides={guides}
            lang={lang}
            onSelect={setSelectedId}
          />
        )}
      </main>
    </div>
  );
};
