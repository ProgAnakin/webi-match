import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, GraduationCap, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { products as coreProducts } from "@/data/products";
import type { ProductGuide, GuideLang } from "./types";
import { ProductGuideList } from "./ProductGuideList";
import { ProductGuideDetail } from "./ProductGuideDetail";

interface ConsulenteDashboardProps {
  onLogout: () => void;
  /** The signed-in user's store role — managers get a shortcut back to /manager. */
  role: string | null;
}

// Read-only consultant training zone. Sky/blue accent throughout — deliberately
// distinct from the orange /manager dashboard so staff never confuse the two.
export const ConsulenteDashboard = ({ onLogout, role }: ConsulenteDashboardProps) => {
  const navigate = useNavigate();
  const [guides, setGuides] = useState<ProductGuide[]>([]);
  // product_id → the customer-facing description (same text shown below the
  // product photo on the match result). Pulled live from the product catalog.
  const [customerDescriptions, setCustomerDescriptions] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lang, setLang] = useState<GuideLang>("it");

  const fetchGuides = useCallback(async () => {
    setLoading(true);
    const [guidesRes, customRes] = await Promise.all([
      supabase.from("product_guides").select("*").order("product_name", { ascending: true }),
      supabase.from("custom_products").select("id, name, description"),
    ]);

    const descMap: Record<string, string> = {};
    const nameMap: Record<string, string> = {};
    for (const p of coreProducts) { descMap[p.id] = p.description; nameMap[p.id] = p.name; }
    for (const c of (customRes.data ?? []) as { id: string; name: string; description: string | null }[]) {
      descMap[c.id] = c.description ?? "";
      nameMap[c.id] = c.name;
    }
    setCustomerDescriptions(descMap);

    // Refresh each guide's product_name from the live catalog so a rename in
    // /manager reflects here without the manager having to re-save the guide.
    const fresh = ((guidesRes.data ?? []) as ProductGuide[]).map((g) => ({
      ...g,
      product_name: nameMap[g.product_id] ?? g.product_name,
    }));
    setGuides(fresh);
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
            {/* Managers came here already authenticated (and MFA-cleared) —
                jump straight back to /manager without a second 2FA. */}
            {role === "manager" && (
              <button
                onClick={() => navigate("/manager")}
                title="Back to Manager"
                className="flex h-8 items-center gap-1 rounded-xl border border-border bg-card px-2.5 text-xs font-semibold text-muted-foreground active:scale-95"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Manager
              </button>
            )}
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
            customerDescription={customerDescriptions[selected.product_id] ?? ""}
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
