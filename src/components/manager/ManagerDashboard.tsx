import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BarChart2, Camera, Check, GraduationCap, HelpCircle, History, Home, Link, LogOut, MapPin, Pencil, Power, PowerOff, RotateCcw, Search, Trash2, X, Undo2, Upload, Download, Inbox } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { products, type Product } from "@/data/products";
import { getStoredStoreId, setStoredStoreId, getStoreById, STORES } from "@/data/stores";
import { useIdleLogout } from "@/hooks/useIdleLogout";
import { StoreSelectorModal } from "./StoreSelectorModal";
import { FaqModal, FaqData, EMPTY_FAQ } from "./FaqModal";
import { SessionsTab } from "./SessionsTab";
import { ProductCatalogTab } from "./ProductCatalogTab";
import { QuizCardsTab } from "./QuizCardsTab";
import { EmailTemplateTab } from "./EmailTemplateTab";
import { RolesTab } from "./RolesTab";
import { GuideEditorTab } from "./GuideEditorTab";

import { resizeImage } from "@/lib/imageProcessing";

type ActiveTab = "catalogo" | "sessioni" | "storico" | "gestione";
type GestioneTab = "catalogo" | "carte" | "email" | "ruoli" | "guida";

/** product_id → active boolean, loaded from Supabase */
type SettingsMap = Record<string, boolean>;
/** product_id → price override string */
type PriceMap = Record<string, string>;
/** product_id → custom image URL */
type ImageMap = Record<string, string>;
/** product_id → YouTube video URL */
type VideoMap = Record<string, string>;
/** product_id → discount percent (5 | 8 | 10) */
type DiscountMap = Record<string, number>;
/** product_id → FAQ data */
type FaqMap = Record<string, FaqData>;
/** product_id → updated_at ISO string */
type UpdatedAtMap = Record<string, string>;

const DISCOUNT_OPTIONS = [5, 8, 10] as const;
type DiscountOption = typeof DISCOUNT_OPTIONS[number];

interface UndoEntry { productId: string; restoredValue: boolean; }

interface AuditLogEntry {
  id: string;
  created_at: string;
  action: string | null;
  product_id: string | null;
  old_active: boolean | null;
  new_active: boolean | null;
  store_id: string | null;
  user_id: string | null;
}

interface ManagerDashboardProps {
  onLogout: () => void;
}

/** Format a timestamp as "oggi", "ieri", "X giorni fa", "X settimane fa" */
function formatUpdatedAt(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 14) return `${diffDays} days ago`;
  const weeks = Math.floor(diffDays / 7);
  return `${weeks} weeks ago`;
}

/** Validate price formats: "€49,00", "49.00", "49,00", "€49" */
function isValidPrice(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed === "") return true; // allow clearing
  return /^€?\d+([.,]\d{1,2})?$/.test(trimmed);
}

/** Validate video URL — must contain youtube.com, youtu.be, or vimeo.com */
function isValidVideoUrl(url: string): boolean {
  const trimmed = url.trim();
  if (trimmed === "") return true; // allow clearing
  return trimmed.includes("youtube.com") || trimmed.includes("youtu.be") || trimmed.includes("vimeo.com");
}

function formatAuditDate(iso: string): string {
  return new Date(iso).toLocaleString("it-IT", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function auditStoreName(id: string | null): string {
  if (!id) return "—";
  return STORES.find((s) => s.id === id)?.shortName ?? id;
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
  const [bulkConfirm, setBulkConfirm] = useState<{ enable: boolean; count: number } | null>(null);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvPreview, setCsvPreview] = useState<{ productId: string; newPrice: string }[]>([]);
  // Undo last toggle — auto-dismisses after 8 s
  const [undoEntry, setUndoEntry] = useState<UndoEntry | null>(null);
  const [undoCountdown, setUndoCountdown] = useState(8);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [userRole, setUserRole] = useState<{ role: string; store_id: string | null } | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("catalogo");
  const [gestioneTab, setGestioneTab] = useState<GestioneTab>("catalogo");
  // Custom products (added via Gestione) — merged into the catalog so they can
  // be managed per-store exactly like core products.
  const [customProducts, setCustomProducts] = useState<Product[]>([]);

  // Storico (audit log) state
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState(false);

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

  // Core + custom products, used everywhere the catalog list is rendered/filtered.
  const catalogProducts = [...products, ...customProducts];
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

  // Fetch audit log when storico tab is active
  const fetchAuditLog = useCallback(async () => {
    setAuditLoading(true);
    setAuditError(false);
    try {
      const { data, error } = await supabase
        .from("manager_audit_log")
        .select("id, created_at, action, product_id, old_active, new_active, store_id, user_id")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) {
        setAuditError(true);
      } else {
        setAuditLog((data ?? []) as AuditLogEntry[]);
      }
    } catch {
      setAuditError(true);
    }
    setAuditLoading(false);
  }, []);

  useEffect(() => {
    if (activeTab === "storico") fetchAuditLog();
  }, [activeTab, fetchAuditLog]);

  /** Core upsert — does NOT create an undo entry. Used by both toggleProduct and handleUndo. */
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

  const toggleProduct = async (productId: string) => {
    const current = settings[productId] ?? true;
    const ok = await saveProductActive(productId, !current);
    if (!ok) return;

    // Arm 8-second undo window with countdown
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    if (undoIntervalRef.current) clearInterval(undoIntervalRef.current);
    setUndoEntry({ productId, restoredValue: current });
    setUndoCountdown(8);

    let remaining = 8;
    undoIntervalRef.current = setInterval(() => {
      remaining -= 1;
      setUndoCountdown(remaining);
      if (remaining <= 0) {
        if (undoIntervalRef.current) clearInterval(undoIntervalRef.current);
      }
    }, 1000);

    undoTimerRef.current = setTimeout(() => {
      setUndoEntry(null);
      if (undoIntervalRef.current) clearInterval(undoIntervalRef.current);
    }, 8000);
  };

  const handleUndo = async () => {
    if (!undoEntry) return;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    if (undoIntervalRef.current) clearInterval(undoIntervalRef.current);
    const entry = undoEntry;
    setUndoEntry(null);
    await saveProductActive(entry.productId, entry.restoredValue);
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

        {/* Header */}
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">📦 Catalog</h1>
            <button
              onClick={() => userRole?.role !== "consulente_responsabile" && setShowStoreModal(true)}
              className={`mt-0.5 flex items-center gap-1 text-xs ${userRole?.role === "consulente_responsabile" ? "text-muted-foreground cursor-default" : "text-primary hover:underline"}`}
            >
              <MapPin className="h-3 w-3" />
              {currentStore?.shortName ?? storeId}
              {userRole?.role === "consulente_responsabile" && <span className="ml-1 opacity-50">(locked)</span>}
            </button>
            <p className="text-xs text-muted-foreground">
              {loading ? "Loading…" : `${activeCount} of ${catalogProducts.length} products active in the quiz`}
              {bulkSelection.size > 0 && <span className="ml-2 font-semibold text-primary">· {bulkSelection.size} selected</span>}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            {bulkSelection.size > 0 && (
              <>
                <button onClick={() => requestBulkToggle(false)}
                  className="flex items-center gap-1 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-400 active:scale-95">
                  <PowerOff className="h-3 w-3" /> Deactivate {bulkSelection.size}
                </button>
                <button onClick={() => requestBulkToggle(true)}
                  className="flex items-center gap-1 rounded-xl border border-green-500/40 bg-green-500/10 px-3 py-2 text-xs text-green-400 active:scale-95">
                  <Power className="h-3 w-3" /> Activate {bulkSelection.size}
                </button>
                <button onClick={() => setBulkSelection(new Set())}
                  className="flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground active:scale-95">
                  <X className="h-3 w-3" /> Cancel
                </button>
              </>
            )}
            <button onClick={fetchSettings}
              className="flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground active:scale-95">
              <RotateCcw className="h-3 w-3" /> Refresh
            </button>
            <button onClick={downloadCsvTemplate}
              className="flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground active:scale-95">
              <Download className="h-3 w-3" /> CSV Template
            </button>
            <label className="flex items-center gap-1 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-primary active:scale-95 cursor-pointer">
              <Upload className="h-3 w-3" /> Upload Prices
              <input
                type="file"
                accept=".csv"
                onChange={(e) => e.target.files?.[0] && handleCsvUpload(e.target.files[0])}
                className="hidden"
              />
            </label>
            <button onClick={() => navigate("/stats")}
              className="flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground active:scale-95">
              <BarChart2 className="h-3 w-3" /> Analytics
            </button>
            <button onClick={() => navigate("/consulente")}
              className="flex items-center gap-1 rounded-xl border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs text-sky-400 active:scale-95">
              <GraduationCap className="h-3 w-3" /> Consulente
            </button>
            <button onClick={handleLogout}
              className="flex items-center gap-1 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive active:scale-95">
              <LogOut className="h-3 w-3" /> Log out
            </button>
            <button onClick={() => { supabase.auth.signOut(); navigate("/"); }}
              className="flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground active:scale-95">
              <Home className="h-3 w-3" /> Quiz
            </button>
          </div>
        </motion.div>

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

        {/* Bulk confirm inline banner */}
        <AnimatePresence>
          {bulkConfirm && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm"
            >
              <p className="text-amber-300 font-semibold mb-2">
                You are about to {bulkConfirm.enable ? "activate" : "deactivate"} {bulkConfirm.count} products. Confirm?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkToggle(bulkConfirm.enable)}
                  className="rounded-xl border border-amber-500/40 bg-amber-500/20 px-4 py-1.5 text-xs font-semibold text-amber-300 active:scale-95"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setBulkConfirm(null)}
                  className="rounded-xl border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab switcher */}
        <motion.div
          className="flex gap-1 rounded-2xl border border-border bg-muted/30 p-1"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
        >
          <button
            onClick={() => setActiveTab("catalogo")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === "catalogo"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            📦 Catalog
          </button>
          <button
            onClick={() => setActiveTab("sessioni")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === "sessioni"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Inbox className="h-3.5 w-3.5" /> Sessions &amp; Codes
          </button>
          <button
            onClick={() => setActiveTab("storico")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === "storico"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <History className="h-3.5 w-3.5" /> History
          </button>
          {userRole?.role !== "consulente_responsabile" && (
            <button
              onClick={() => setActiveTab("gestione")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                activeTab === "gestione"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🗂️ Management
            </button>
          )}
        </motion.div>

        {/* Gestione globale (admin master only) */}
        {activeTab === "gestione" && (
          <div className="space-y-4">
            {/* Sub-tab switcher */}
            <div className="flex gap-1 rounded-2xl border border-border bg-muted/30 p-1">
              <button
                onClick={() => setGestioneTab("catalogo")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
                  gestioneTab === "catalogo"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                📦 Global catalog
              </button>
              <button
                onClick={() => setGestioneTab("carte")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
                  gestioneTab === "carte"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                🃏 Quiz Cards
              </button>
              <button
                onClick={() => setGestioneTab("email")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
                  gestioneTab === "email"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                📧 Email
              </button>
              <button
                onClick={() => setGestioneTab("ruoli")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
                  gestioneTab === "ruoli"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                👥 Roles
              </button>
              <button
                onClick={() => setGestioneTab("guida")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
                  gestioneTab === "guida"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                🎓 Guide
              </button>
            </div>
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

        {/* Storico (audit log) tab */}
        {activeTab === "storico" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Catalog change history</h2>
              <button
                onClick={fetchAuditLog}
                className="flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground active:scale-95"
              >
                <RotateCcw className="h-3 w-3" /> Refresh
              </button>
            </div>

            {auditLoading ? (
              <div className="py-16 text-center text-muted-foreground text-sm">Loading history…</div>
            ) : auditError || auditLog.length === 0 ? (
              <div className="rounded-2xl border border-border bg-muted/20 py-12 text-center">
                <p className="text-2xl mb-2">📋</p>
                <p className="text-sm font-medium text-foreground">No history available</p>
                <p className="text-xs text-muted-foreground mt-1">Future changes will appear here.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {auditLog.map((entry) => {
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
              const isActive = settings[product.id] !== false;
              const isSaving = savingId === product.id;
              const faqData = faqOverrides[product.id];
              // A custom product can carry its own FAQ (custom_products.faq);
              // fall back to it so the button reflects reality, not just the
              // per-store override.
              const ownFaqHasContent = (product.faq ?? []).some((f) => f.q?.trim() && f.a?.trim());
              const faqComplete = !!(faqData?.q1 && faqData?.a1) || ownFaqHasContent;
              const faqPartial = !faqComplete && !!(faqData?.q1);
              // Effective video: per-store override OR the product's own link.
              const hasVideo = !!videoOverrides[product.id]
                || (!!product.videoUrl && product.videoUrl !== "#");
              const updatedAt = updatedAtMap[product.id];
              return (
                <motion.div
                  key={product.id}
                  className={`overflow-hidden rounded-2xl border bg-card shadow-card transition-all duration-300 ${
                    isActive ? "border-border" : "border-border/30"
                  }`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: isActive ? 1 : 0.52, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  {/* Status accent bar */}
                  <div className={`h-0.5 w-full transition-colors duration-500 ${isActive ? "gradient-primary" : "bg-border/40"}`} />

                  <div className="p-4">
                    {/* ── Row 1: checkbox · status · name · toggle ─────── */}
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={bulkSelection.has(product.id)}
                        onChange={(e) => {
                          const newSet = new Set(bulkSelection);
                          if (e.target.checked) newSet.add(product.id);
                          else newSet.delete(product.id);
                          setBulkSelection(newSet);
                        }}
                        className="mt-1.5 h-4 w-4 shrink-0 cursor-pointer"
                      />
                      <div className="min-w-0 flex-1">
                        <span className={`mb-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${
                          isActive ? "text-green-400" : "text-muted-foreground"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-green-400" : "bg-muted-foreground"}`} />
                          {isActive ? "Active" : "Paused"}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold leading-snug text-foreground">{product.name}</h3>
                          {customProductIds.has(product.id) && (
                            <span className="shrink-0 rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">
                              Custom
                            </span>
                          )}
                        </div>
                        {updatedAt && (
                          <p className="mt-0.5 text-[10px] text-muted-foreground/50">
                            Updated: {formatUpdatedAt(updatedAt)}
                          </p>
                        )}
                      </div>
                      <motion.button
                        onClick={() => !isSaving && toggleProduct(product.id)}
                        disabled={isSaving}
                        className={`shrink-0 flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                          isActive
                            ? "border-destructive/30 bg-destructive/10 text-destructive active:bg-destructive/20"
                            : "border-green-500/30 bg-green-500/10 text-green-400 active:bg-green-500/20"
                        }`}
                        whileTap={{ scale: 0.95 }}
                      >
                        {isSaving ? <span className="animate-pulse">…</span>
                          : isActive ? <><PowerOff className="h-3 w-3" /> Deactivate</>
                          : <><Power className="h-3 w-3" /> Reactivate</>}
                      </motion.button>
                    </div>

                    {/* ── Row 2: price · discount ──────────────────── */}
                    <div className="ml-7 mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                      {/* Price */}
                      {editingPriceId === product.id ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <input
                              autoFocus
                              value={draftPrice}
                              onChange={(e) => { setDraftPrice(e.target.value); setPriceError(null); }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") savePriceOverride(product.id, draftPrice);
                                if (e.key === "Escape") { setEditingPriceId(null); setPriceError(null); }
                              }}
                              className="w-28 rounded-lg border border-primary bg-card px-2 py-1 text-sm font-semibold text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                              placeholder="€0,00"
                            />
                            <button onClick={() => savePriceOverride(product.id, draftPrice)}
                              className="rounded-lg bg-primary/20 p-1.5 text-primary hover:bg-primary/30">
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => { setEditingPriceId(null); setPriceError(null); }}
                              className="rounded-lg bg-muted p-1.5 text-muted-foreground">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          {priceError && (
                            <p className="text-[10px] text-destructive">{priceError}</p>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingPriceId(product.id); setDraftPrice(priceOverrides[product.id] ?? product.price); setPriceError(null); }}
                          className="group flex items-center gap-1.5"
                        >
                          <span className="text-sm font-bold text-primary">
                            {priceOverrides[product.id] ?? product.price}
                          </span>
                          {priceOverrides[product.id] && (
                            <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-400">custom</span>
                          )}
                          <Pencil className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        </button>
                      )}

                      <span className="hidden h-3 w-px bg-border/50 sm:block" />

                      {/* Discount */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Discount:</span>
                        {DISCOUNT_OPTIONS.map((opt) => {
                          const sel = (discountOverrides[product.id] ?? 5) === opt;
                          return (
                            <button key={opt} onClick={() => saveDiscount(product.id, opt)}
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-colors ${
                                sel ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                              }`}>
                              {opt}%
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* ── Row 3: media actions + tags ────────────────── */}
                    <div className="ml-7 mt-3 flex flex-wrap items-center gap-2">

                      {/* Image */}
                      {imageOverrides[product.id] ? (
                        <div className="flex items-center gap-1.5">
                          <img src={imageOverrides[product.id]} alt={product.name}
                            loading="lazy" decoding="async"
                            className="h-8 w-12 rounded-md border border-border object-cover" />
                          <button onClick={() => removeProductImage(product.id)}
                            className="flex items-center gap-1 rounded-lg border border-destructive/30 bg-destructive/10 px-2 py-1 text-[10px] text-destructive active:scale-95">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <label className={`flex cursor-pointer items-center gap-1 rounded-lg border border-border bg-muted/50 px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground hover:bg-muted active:scale-95 ${
                          uploadingImageId === product.id ? "animate-pulse" : ""
                        }`}>
                          <Camera className="h-3 w-3" />
                          {uploadingImageId === product.id ? "…" : "Photo"}
                          <input type="file" accept="image/*" className="hidden"
                            disabled={uploadingImageId !== null}
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadProductImage(product.id, f); e.target.value = ""; }} />
                        </label>
                      )}

                      {/* Video */}
                      {editingVideoId === product.id ? (
                        <div className="flex flex-col gap-1 flex-1">
                          <div className="flex items-center gap-1.5">
                            <input autoFocus value={draftVideo}
                              onChange={(e) => { setDraftVideo(e.target.value); setVideoError(null); }}
                              onKeyDown={(e) => { if (e.key === "Enter") saveVideoUrl(product.id, draftVideo); if (e.key === "Escape") { setEditingVideoId(null); setVideoError(null); } }}
                              placeholder="https://youtube.com/watch?v=..."
                              className="flex-1 rounded-lg border border-primary bg-card px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                            <button onClick={() => saveVideoUrl(product.id, draftVideo)}
                              className="rounded-lg bg-primary/20 p-1.5 text-primary"><Check className="h-3.5 w-3.5" /></button>
                            <button onClick={() => { setEditingVideoId(null); setVideoError(null); }}
                              className="rounded-lg bg-muted p-1.5 text-muted-foreground"><X className="h-3.5 w-3.5" /></button>
                          </div>
                          {videoError && (
                            <p className="text-[10px] text-destructive">{videoError}</p>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingVideoId(product.id);
                            setDraftVideo(
                              videoOverrides[product.id]
                              ?? (product.videoUrl && product.videoUrl !== "#" ? product.videoUrl : "")
                            );
                            setVideoError(null);
                          }}
                          className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[10px] font-medium transition-colors ${
                            hasVideo
                              ? "border-green-500/40 bg-green-500/10 text-green-400"
                              : "border-border bg-muted/50 text-muted-foreground hover:bg-muted"
                          }`}>
                          <Link className="h-3 w-3" />
                          {hasVideo ? "Video ✓" : "Video"}
                        </button>
                      )}

                      {/* FAQ */}
                      <button
                        onClick={() => setEditingFaqId(product.id)}
                        className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[10px] font-medium transition-colors ${
                          faqComplete
                            ? "border-primary/40 bg-primary/10 text-primary"
                            : faqPartial
                            ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                            : "border-border bg-muted/50 text-muted-foreground hover:bg-muted"
                        }`}>
                        <HelpCircle className="h-3 w-3" />
                        {faqComplete ? "FAQ ✓" : faqPartial ? "FAQ ⚠" : "FAQ"}
                      </button>

                      {/* Tags */}
                      <div className="ml-auto flex flex-wrap gap-1">
                        {product.tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[10px] capitalize text-muted-foreground">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <p className="pb-4 text-center text-xs text-muted-foreground">
          Webi Match · Catalog Management · Costanzo Annichini
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

      {/* CSV Preview Modal */}
      <AnimatePresence>
        {showCsvModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowCsvModal(false)}
          >
            <motion.div
              className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl max-h-[70vh] overflow-y-auto"
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold text-foreground mb-4">Confirm price update</h2>
              <div className="space-y-2 mb-6">
                {csvPreview.map(({ productId, newPrice }) => {
                  const prod = products.find((p) => p.id === productId);
                  return (
                    <div key={productId} className="text-xs p-2 rounded-lg border border-border bg-background/40">
                      <p className="font-semibold text-foreground">{prod?.name ?? productId}</p>
                      <p className="text-muted-foreground">{prod?.price ?? "—"} → <span className="text-primary font-semibold">{newPrice}</span></p>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCsvModal(false)}
                  className="flex-1 rounded-xl border border-border bg-muted px-4 py-2 text-sm text-muted-foreground active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={applyPriceUpload}
                  className="flex-1 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary active:scale-95"
                >
                  Apply {csvPreview.length}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Undo toast — fixed bottom, auto-dismisses after 8 s */}
      <AnimatePresence>
        {undoEntry && (
          <motion.div
            className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-border bg-card px-5 py-3.5 shadow-2xl"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
          >
            <span className="text-sm text-foreground">
              Change saved.
            </span>
            <button
              onClick={handleUndo}
              className="flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary active:scale-95"
            >
              <Undo2 className="h-3.5 w-3.5" /> Undo ({undoCountdown}s)
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
