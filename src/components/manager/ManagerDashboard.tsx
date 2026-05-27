import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { RotateCcw, Search, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { type Product } from "@/data/products";
import { getStoredStoreId, setStoredStoreId, getStoreById } from "@/data/stores";
import { useIdleLogout } from "@/hooks/useIdleLogout";
import { StoreSelectorModal } from "./StoreSelectorModal";
import { FaqModal, FaqData, EMPTY_FAQ } from "./FaqModal";
import { SessionsTab } from "./SessionsTab";
import { ProductCatalogTab } from "./ProductCatalogTab";
import { QuizCardsTab } from "./QuizCardsTab";
import { EmailTemplateTab } from "./EmailTemplateTab";
import { RolesTab } from "./RolesTab";
import { GuideEditorTab } from "./GuideEditorTab";
import { BulkConfirmBanner, type BulkConfirmIntent } from "./BulkConfirmBanner";
import { SendToStoreModal } from "./SendToStoreModal";
import { CsvPreviewModal, type CsvPriceUpdate } from "./CsvPreviewModal";
import { UndoSnackbar } from "./UndoSnackbar";
import {
  isValidPrice, isValidVideoUrl,
  type SettingsMap, type PriceMap, type ImageMap, type VideoMap,
  type DiscountMap, type FaqMap, type UpdatedAtMap, type DiscountOption,
} from "./managerDashboardUtils";
import { AuditLogTab } from "./AuditLogTab";
import { PrimaryTabs, ManagementSubTabs, type ActiveTab, type GestioneTab } from "./TabSwitcher";
import { ProductRow } from "./ProductRow";
import { ManagerHeader } from "./ManagerHeader";
import { useAuditLog } from "./useAuditLog";
import { useUndoToggle } from "./useUndoToggle";

import { resizeImage } from "@/lib/imageProcessing";

interface ManagerDashboardProps {
  onLogout: () => void;
}

export const ManagerDashboard = ({ onLogout }: ManagerDashboardProps) => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SettingsMap>({});
  const [priceOverrides, setPriceOverrides] = useState<PriceMap>({});
  const [imageOverrides, setImageOverrides] = useState<ImageMap>({});
  const [videoOverrides, setVideoOverrides] = useState<VideoMap>({});
  const [discountOverrides, setDiscountOverrides] = useState<DiscountMap>({});
  const [faqOverrides, setFaqOverrides] = useState<FaqMap>({});
  const [updatedAtMap, setUpdatedAtMap] = useState<UpdatedAtMap>({});
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [draftVideo, setDraftVideo] = useState("");
  const [videoError, setVideoError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [draftPrice, setDraftPrice] = useState("");
  const [priceError, setPriceError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [storeId, setStoreIdState] = useState<string>(
    () => getStoredStoreId() ?? "corso-vercelli"
  );
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [bulkSelection, setBulkSelection] = useState<Set<string>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState<BulkConfirmIntent | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvPreview, setCsvPreview] = useState<CsvPriceUpdate[]>([]);
  const [userRole, setUserRole] = useState<{ role: string; store_id: string | null } | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("catalogo");
  const [gestioneTab, setGestioneTab] = useState<GestioneTab>("catalogo");
  // Custom products (added via Gestione) — merged into the catalog so they can
  // be managed per-store exactly like core products.
  const [customProducts, setCustomProducts] = useState<Product[]>([]);

  const currentStore = getStoreById(storeId);

  useIdleLogout(onLogout);

  // Fetch the logged-in user's store role; lock store selector for consulente.
  useEffect(() => {
    supabase.rpc("get_my_store_role").then(({ data }) => {
      if (!data || data.length === 0) return;
      const r = data[0] as { role: string; store_id: string | null };
      setUserRole(r);
      if (r.role === "consulente_responsabile" && r.store_id) {
        setStoreIdState(r.store_id);
        setStoredStoreId(r.store_id);
      }
    });
  }, []);

  // The whole catalog lives in custom_products now — single source of truth.
  const catalogProducts = customProducts;
  const customProductIds = new Set(customProducts.map((p) => p.id));

  const allTags = Array.from(new Set(catalogProducts.flatMap((p) => p.tags))).sort();

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("product_settings")
      .select("product_id, active, price_override, image_url, video_url, discount_percent, faq_q1, faq_a1, faq_q2, faq_a2, faq_q3, faq_a3, updated_at")
      .eq("store_id", storeId);
    if (data) {
      const map: SettingsMap = {};
      const prices: PriceMap = {};
      const images: ImageMap = {};
      const videos: VideoMap = {};
      const discounts: DiscountMap = {};
      const faqs: FaqMap = {};
      const updatedAt: UpdatedAtMap = {};
      data.forEach((row) => {
        map[row.product_id] = row.active;
        if (row.price_override) prices[row.product_id] = row.price_override;
        if (row.image_url) images[row.product_id] = row.image_url;
        if (row.video_url) videos[row.product_id] = row.video_url;
        if (row.discount_percent) discounts[row.product_id] = row.discount_percent;
        const { faq_q1, faq_a1, faq_q2, faq_a2, faq_q3, faq_a3, updated_at: ua } = row;
        if (faq_q1 || faq_q2 || faq_q3) {
          faqs[row.product_id] = {
            q1: faq_q1 ?? "", a1: faq_a1 ?? "",
            q2: faq_q2 ?? "", a2: faq_a2 ?? "",
            q3: faq_q3 ?? "", a3: faq_a3 ?? "",
          };
        }
        if (ua) updatedAt[row.product_id] = ua;
      });
      setSettings(map);
      setPriceOverrides(prices);
      setImageOverrides(images);
      setVideoOverrides(videos);
      setDiscountOverrides(discounts);
      setFaqOverrides(faqs);
      setUpdatedAtMap(updatedAt);
    }
    setLoading(false);
  }, [storeId]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  // Fetch active custom products so they appear in the catalog alongside core ones.
  const fetchCustomProducts = useCallback(async () => {
    const { data } = await supabase
      .from("custom_products")
      .select("id, name, description, price, rating, image_url, video_url, tags, faq")
      .eq("status", "active");
    if (!data) return;
    setCustomProducts(
      data.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        price: r.price,
        rating: r.rating,
        image: r.image_url ?? "/products/placeholder.png",
        videoUrl: r.video_url ?? "#",
        tags: r.tags ?? [],
        faq: (r.faq as { q: string; a: string }[]) ?? [],
      })),
    );
  }, []);

  useEffect(() => { fetchCustomProducts(); }, [fetchCustomProducts]);

  const auditLog = useAuditLog(activeTab === "storico");

  /** Core upsert — does NOT create an undo entry. Used by both toggleProduct and the undo revert. */
  const saveProductActive = async (productId: string, targetActive: boolean) => {
    const current = settings[productId] ?? true;
    setSettings((prev) => ({ ...prev, [productId]: targetActive }));
    setSavingId(productId);
    setSaveError(null);

    const { error } = await supabase
      .from("product_settings")
      .upsert({ product_id: productId, store_id: storeId, active: targetActive, updated_at: new Date().toISOString() });

    if (error) {
      setSavingId(null);
      setSettings((prev) => ({ ...prev, [productId]: current }));
      setSaveError("Error saving. Check the connection and try again.");
      toast.error("Error saving. Check the connection.");
      return false;
    }

    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return; // session expired — skip audit log rather than write a null-author entry
      supabase.from("manager_audit_log").insert({
        user_id: data.user.id,
        user_email: data.user.email,
        product_id: productId,
        action: "product_toggle",
        old_active: current,
        new_active: targetActive,
        store_id: storeId,
      });
    });

    setSavingId(null);
    return true;
  };

  const undo = useUndoToggle(async (entry) => {
    await saveProductActive(entry.productId, entry.restoredValue);
  });

  const toggleProduct = async (productId: string) => {
    const current = settings[productId] ?? true;
    const ok = await saveProductActive(productId, !current);
    if (!ok) return;
    undo.arm({ productId, restoredValue: current });
  };

  const savePriceOverride = async (productId: string, price: string) => {
    const trimmed = price.trim();
    if (trimmed !== "" && !isValidPrice(trimmed)) {
      setPriceError("Invalid format (e.g. €49.00)");
      return;
    }
    setPriceError(null);
    const { error } = await supabase
      .from("product_settings")
      .upsert({
        product_id: productId,
        store_id: storeId,
        price_override: trimmed || null,
        updated_at: new Date().toISOString(),
      });
    if (!error) {
      setPriceOverrides((prev) => {
        if (!trimmed) { const n = { ...prev }; delete n[productId]; return n; }
        return { ...prev, [productId]: trimmed };
      });
    }
    setEditingPriceId(null);
  };

  const saveVideoUrl = async (productId: string, url: string) => {
    const trimmed = url.trim();
    if (trimmed !== "" && !isValidVideoUrl(trimmed)) {
      setVideoError("Invalid URL — use YouTube or Vimeo");
      return;
    }
    setVideoError(null);
    await supabase.from("product_settings").upsert({
      product_id: productId,
      store_id: storeId,
      video_url: trimmed || null,
      updated_at: new Date().toISOString(),
    });
    setVideoOverrides((prev) => {
      if (!trimmed) { const n = { ...prev }; delete n[productId]; return n; }
      return { ...prev, [productId]: trimmed };
    });
    setEditingVideoId(null);
  };

  const requestBulkToggle = (enable: boolean) => {
    setBulkConfirm({ enable, count: bulkSelection.size });
  };

  const handleBulkToggle = async (enable: boolean) => {
    for (const productId of bulkSelection) {
      await saveProductActive(productId, enable);
    }
    setBulkSelection(new Set());
    setBulkConfirm(null);
  };

  // Copies the selected products into another store's catalog — carries this
  // store's per-store config (price / image / video / discount / FAQ) and
  // marks them active in the target store.
  const sendToStore = async (targetStoreId: string) => {
    const ids = [...bulkSelection];
    if (ids.length === 0) return;
    setSending(true);
    const { data: srcRows } = await supabase
      .from("product_settings")
      .select("product_id, price_override, image_url, video_url, discount_percent, faq_q1, faq_a1, faq_q2, faq_a2, faq_q3, faq_a3")
      .eq("store_id", storeId)
      .in("product_id", ids);
    const byId = new Map((srcRows ?? []).map((r) => [r.product_id, r]));
    const payload = ids.map((pid) => {
      const src = byId.get(pid);
      return {
        product_id: pid,
        store_id: targetStoreId,
        active: true,
        price_override:   src?.price_override   ?? null,
        image_url:        src?.image_url        ?? null,
        video_url:        src?.video_url        ?? null,
        discount_percent: src?.discount_percent ?? 5,
        faq_q1: src?.faq_q1 ?? null, faq_a1: src?.faq_a1 ?? null,
        faq_q2: src?.faq_q2 ?? null, faq_a2: src?.faq_a2 ?? null,
        faq_q3: src?.faq_q3 ?? null, faq_a3: src?.faq_a3 ?? null,
        updated_at: new Date().toISOString(),
      };
    });
    const { error } = await supabase
      .from("product_settings")
      .upsert(payload, { onConflict: "product_id,store_id" });
    setSending(false);
    setShowSendModal(false);
    if (error) {
      toast.error("Error sending products to the store.");
      return;
    }
    const target = getStoreById(targetStoreId);
    toast.success(`${ids.length} product${ids.length > 1 ? "s" : ""} sent to ${target?.shortName ?? targetStoreId}.`);
    setBulkSelection(new Set());
  };

  const handleCsvUpload = async (file: File) => {
    const text = await file.text();
    const lines = text.trim().split("\n");
    const parsed: { productId: string; newPrice: string }[] = [];

    for (const line of lines) {
      const [productId, price] = line.split(",").map((s) => s.trim());
      if (productId && price) {
        parsed.push({ productId, newPrice: price });
      }
    }

    setCsvPreview(parsed);
    setShowCsvModal(true);
  };

  const applyPriceUpload = async () => {
    for (const { productId, newPrice } of csvPreview) {
      await savePriceOverride(productId, newPrice);
    }
    toast.success(`${csvPreview.length} prices updated from CSV.`);
    setCsvPreview([]);
    setShowCsvModal(false);
  };

  const uploadProductImage = async (productId: string, rawFile: File) => {
    if (rawFile.size > 5 * 1024 * 1024) {
      toast.error("Image too large — maximum 5 MB.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(rawFile.type)) {
      toast.error("Unsupported format — use JPEG, PNG, WebP or GIF.");
      return;
    }
    setUploadingImageId(productId);
    // #8 — auto-resize to max 1024px before upload
    const file = await resizeImage(rawFile);
    const path = `${storeId}/${productId}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, file, { upsert: true, contentType: "image/jpeg" });

    if (uploadError) {
      toast.error("Image upload error: " + uploadError.message);
      setUploadingImageId(null);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(path);

    const imageUrl = urlData.publicUrl;

    await supabase.from("product_settings").upsert({
      product_id: productId,
      store_id: storeId,
      image_url: imageUrl,
      updated_at: new Date().toISOString(),
    });

    setImageOverrides((prev) => ({ ...prev, [productId]: imageUrl }));
    toast.success("Image uploaded.");
    setUploadingImageId(null);
  };

  const removeProductImage = async (productId: string) => {
    await supabase.from("product_settings").upsert({
      product_id: productId,
      store_id: storeId,
      image_url: null,
      updated_at: new Date().toISOString(),
    });
    setImageOverrides((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const saveDiscount = async (productId: string, pct: DiscountOption) => {
    await supabase.from("product_settings").upsert({
      product_id: productId,
      store_id: storeId,
      discount_percent: pct,
      updated_at: new Date().toISOString(),
    });
    setDiscountOverrides((prev) => ({ ...prev, [productId]: pct }));
  };

  const saveFaq = async (productId: string, faq: FaqData) => {
    await supabase.from("product_settings").upsert({
      product_id: productId,
      store_id: storeId,
      faq_q1: faq.q1 || null, faq_a1: faq.a1 || null,
      faq_q2: faq.q2 || null, faq_a2: faq.a2 || null,
      faq_q3: faq.q3 || null, faq_a3: faq.a3 || null,
      updated_at: new Date().toISOString(),
    });
    setFaqOverrides((prev) => ({ ...prev, [productId]: faq }));
    setEditingFaqId(null);
  };

  const downloadCsvTemplate = () => {
    const header = "product_id,price\n";
    const rows = catalogProducts.map((p) => `${p.id},${p.price}`).join("\n");
    const csv = header + rows;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product-prices.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  // #11 — Keyboard shortcuts: Ctrl+S → refresh settings, Esc → clear bulk selection / close modals
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ignore if focused on an input/textarea
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement).tagName)) return;
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        fetchSettings();
        toast.info("Catalog refreshed.");
      }
      if (e.key === "Escape") {
        if (bulkSelection.size > 0) setBulkSelection(new Set());
        if (bulkConfirm) setBulkConfirm(null);
        if (showCsvModal) setShowCsvModal(false);
        if (showStoreModal) setShowStoreModal(false);
        if (editingFaqId) setEditingFaqId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fetchSettings, bulkSelection.size, bulkConfirm, showCsvModal, showStoreModal, editingFaqId]);

  const sortedProducts = [...catalogProducts].sort((a, b) => {
    const aOn = settings[a.id] !== false;
    const bOn = settings[b.id] !== false;
    if (aOn === bOn) return 0;
    return aOn ? -1 : 1;
  });

  const filteredProducts = sortedProducts.filter((p) => {
    const matchSearch = search === "" || p.name.toLowerCase().includes(search.toLowerCase());
    const matchTag = filterTag === null || p.tags.includes(filterTag);
    return matchSearch && matchTag;
  });

  const activeCount = catalogProducts.filter((p) => settings[p.id] !== false).length;

  // Select-all: true if all filtered products are in bulkSelection
  const allFilteredSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((p) => bulkSelection.has(p.id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSet = new Set(bulkSelection);
      filteredProducts.forEach((p) => newSet.add(p.id));
      setBulkSelection(newSet);
    } else {
      const newSet = new Set(bulkSelection);
      filteredProducts.forEach((p) => newSet.delete(p.id));
      setBulkSelection(newSet);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">

        <ManagerHeader
          currentStore={currentStore}
          storeId={storeId}
          storeLocked={userRole?.role === "consulente_responsabile"}
          loading={loading}
          catalogSize={catalogProducts.length}
          activeCount={activeCount}
          bulkSelectionSize={bulkSelection.size}
          onOpenStoreModal={() => setShowStoreModal(true)}
          onBulkActivate={() => requestBulkToggle(true)}
          onBulkDeactivate={() => requestBulkToggle(false)}
          onOpenSendModal={() => setShowSendModal(true)}
          onClearBulkSelection={() => setBulkSelection(new Set())}
          onRefresh={fetchSettings}
          onDownloadCsvTemplate={downloadCsvTemplate}
          onCsvUpload={handleCsvUpload}
          onOpenAnalytics={() => navigate("/stats")}
          onOpenConsulente={() => navigate("/consulente")}
          onLogout={handleLogout}
          onBackToQuiz={() => { supabase.auth.signOut(); navigate("/"); }}
        />

        {/* Error banner */}
        <AnimatePresence>
          {saveError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {saveError}
            </motion.div>
          )}
        </AnimatePresence>

        <BulkConfirmBanner
          intent={bulkConfirm}
          onConfirm={handleBulkToggle}
          onCancel={() => setBulkConfirm(null)}
        />

        <PrimaryTabs
          active={activeTab}
          showManagement={userRole?.role !== "consulente_responsabile"}
          onChange={setActiveTab}
        />

        {activeTab === "gestione" && (
          <div className="space-y-4">
            <ManagementSubTabs active={gestioneTab} onChange={setGestioneTab} />
            {gestioneTab === "catalogo" && <ProductCatalogTab />}
            {gestioneTab === "carte"    && <QuizCardsTab />}
            {gestioneTab === "email"    && <EmailTemplateTab />}
            {gestioneTab === "ruoli"    && <RolesTab />}
            {gestioneTab === "guida"    && <GuideEditorTab />}
          </div>
        )}

        {/* Sessions tab */}
        {activeTab === "sessioni" && (
          <SessionsTab
            storeId={storeId}
            isGlobal={userRole?.role !== "consulente_responsabile"}
          />
        )}

        {activeTab === "storico" && (
          <AuditLogTab
            loading={auditLog.loading}
            error={auditLog.error}
            entries={auditLog.entries}
            catalogProducts={catalogProducts}
            onRefresh={auditLog.refetch}
          />
        )}

        {/* Catalogo-only sections below */}
        {activeTab === "catalogo" && (<>

        {/* Info banner */}
        <motion.div
          className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-muted-foreground leading-relaxed"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        >
          💡 Products marked <strong className="text-foreground">Paused</strong> are excluded from
          quiz matches — useful for out-of-stock items or ended partnerships. Changes apply
          immediately: the next quiz session will use the updated list.
        </motion.div>

        {/* Search + tag filter */}
        {!loading && (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text" placeholder="Search products…" value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-border bg-card pl-9 pr-9 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {search && (
                <button onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setFilterTag(null)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  filterTag === null ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                All
              </button>
              {allTags.map((tag) => (
                <button key={tag} onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                  className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                    filterTag === tag ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Product list */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card p-4 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="h-4 w-4 rounded bg-muted/50 mt-1.5 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-12 rounded bg-muted/50" />
                    <div className="h-5 w-48 rounded bg-muted/50" />
                    <div className="h-3 w-24 rounded bg-muted/40" />
                  </div>
                  <div className="h-8 w-20 rounded-xl bg-muted/50 shrink-0" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            No products found for "{search || filterTag}".
          </div>
        ) : (
          <div className="space-y-3">
            {/* Select-all header */}
            <div className="flex items-center gap-2 px-1">
              <input
                type="checkbox"
                id="select-all-checkbox"
                checked={allFilteredSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="h-4 w-4 cursor-pointer"
              />
              <label htmlFor="select-all-checkbox" className="cursor-pointer text-xs text-muted-foreground select-none">
                Select all ({filteredProducts.length})
              </label>
            </div>

            {filteredProducts.map((product, i) => {
              const faqData = faqOverrides[product.id];
              const ownFaqHasContent = (product.faq ?? []).some((f) => f.q?.trim() && f.a?.trim());
              const faqComplete = !!(faqData?.q1 && faqData?.a1) || ownFaqHasContent;
              const ownImage = product.image && product.image !== "/products/placeholder.png"
                ? product.image : "";
              const ownVideo = product.videoUrl && product.videoUrl !== "#" ? product.videoUrl : "";
              return (
                <ProductRow
                  key={product.id}
                  product={product}
                  index={i}
                  isActive={settings[product.id] !== false}
                  isSaving={savingId === product.id}
                  isCustom={customProductIds.has(product.id)}
                  updatedAt={updatedAtMap[product.id]}
                  bulkSelected={bulkSelection.has(product.id)}
                  onBulkSelectToggle={(selected) => {
                    const next = new Set(bulkSelection);
                    if (selected) next.add(product.id);
                    else next.delete(product.id);
                    setBulkSelection(next);
                  }}
                  onToggle={() => toggleProduct(product.id)}
                  priceOverride={priceOverrides[product.id]}
                  price={{
                    active: editingPriceId === product.id,
                    draft: draftPrice,
                    error: priceError,
                    onStart: (current) => {
                      setEditingPriceId(product.id);
                      setDraftPrice(current);
                      setPriceError(null);
                    },
                    onChange: (value) => { setDraftPrice(value); setPriceError(null); },
                    onSubmit: (value) => savePriceOverride(product.id, value),
                    onCancel: () => { setEditingPriceId(null); setPriceError(null); },
                  }}
                  discount={(discountOverrides[product.id] ?? 5) as DiscountOption}
                  onDiscountChange={(value) => saveDiscount(product.id, value)}
                  image={{
                    hasOverride: !!imageOverrides[product.id],
                    shown: imageOverrides[product.id] || ownImage,
                    uploading: uploadingImageId === product.id,
                    anyUploading: uploadingImageId !== null,
                    onUpload: (file) => uploadProductImage(product.id, file),
                    onRemove: () => removeProductImage(product.id),
                  }}
                  video={{
                    active: editingVideoId === product.id,
                    draft: draftVideo,
                    error: videoError,
                    hasVideo: !!videoOverrides[product.id] || !!ownVideo,
                    onStart: () => {
                      setEditingVideoId(product.id);
                      setDraftVideo(videoOverrides[product.id] ?? ownVideo);
                      setVideoError(null);
                    },
                    onChange: (value) => { setDraftVideo(value); setVideoError(null); },
                    onSubmit: (value) => saveVideoUrl(product.id, value),
                    onCancel: () => { setEditingVideoId(null); setVideoError(null); },
                  }}
                  faq={{
                    complete: faqComplete,
                    partial: !faqComplete && !!(faqData?.q1),
                    onOpen: () => setEditingFaqId(product.id),
                  }}
                />
              );
            })}
          </div>
        )}

        <p className="pb-4 text-center text-xs text-muted-foreground">
          Webi Match · Catalog Management · Webidoo Store
        </p>

        </>)} {/* end catalogo tab */}
      </div>

      {/* FAQ Modal */}
      <AnimatePresence>
        {editingFaqId && (() => {
          const prod = catalogProducts.find((p) => p.id === editingFaqId);
          if (!prod) return null;
          return (
            <FaqModal
              key={editingFaqId}
              productName={prod.name}
              initial={faqOverrides[editingFaqId] ?? EMPTY_FAQ}
              onSave={(data) => saveFaq(editingFaqId, data)}
              onClose={() => setEditingFaqId(null)}
            />
          );
        })()}
      </AnimatePresence>

      {/* Store selector modal */}
      <AnimatePresence>
        {showStoreModal && (
          <StoreSelectorModal
            currentId={storeId}
            onSelect={(id) => {
              setStoredStoreId(id);
              setStoreIdState(id);
              setSettings({});
              setShowStoreModal(false);
            }}
            onClose={() => setShowStoreModal(false)}
          />
        )}
      </AnimatePresence>

      <SendToStoreModal
        open={showSendModal}
        sourceStoreId={storeId}
        selectionCount={bulkSelection.size}
        sending={sending}
        onSend={sendToStore}
        onClose={() => setShowSendModal(false)}
      />

      <CsvPreviewModal
        open={showCsvModal}
        preview={csvPreview}
        catalogProducts={catalogProducts}
        onApply={applyPriceUpload}
        onClose={() => setShowCsvModal(false)}
      />

      <UndoSnackbar
        visible={!!undo.entry}
        countdown={undo.countdown}
        onUndo={undo.trigger}
      />
    </div>
  );
};
