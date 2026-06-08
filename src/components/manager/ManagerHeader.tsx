import { motion } from "framer-motion";
import { BarChart2, Download, GraduationCap, Home, LogOut, MapPin, Power, PowerOff, RotateCcw, Upload, X } from "lucide-react";
import type { Store } from "@/data/stores";

interface ManagerHeaderProps {
  currentStore: Store | undefined;
  storeId: string;
  storeLocked: boolean;
  loading: boolean;
  catalogSize: number;
  activeCount: number;
  bulkSelectionSize: number;
  onOpenStoreModal: () => void;
  onBulkActivate: () => void;
  onBulkDeactivate: () => void;
  onOpenSendModal: () => void;
  onClearBulkSelection: () => void;
  onRefresh: () => void;
  onDownloadCsvTemplate: () => void;
  onCsvUpload: (file: File) => void;
  onOpenAnalytics: () => void;
  onOpenConsulente: () => void;
  onLogout: () => void;
  onBackToQuiz: () => void;
}

export const ManagerHeader = ({
  currentStore,
  storeId,
  storeLocked,
  loading,
  catalogSize,
  activeCount,
  bulkSelectionSize,
  onOpenStoreModal,
  onBulkActivate,
  onBulkDeactivate,
  onOpenSendModal,
  onClearBulkSelection,
  onRefresh,
  onDownloadCsvTemplate,
  onCsvUpload,
  onOpenAnalytics,
  onOpenConsulente,
  onLogout,
  onBackToQuiz,
}: ManagerHeaderProps) => (
  <motion.div
    className="flex items-center justify-between"
    initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
  >
    <div>
      <h1 className="text-2xl font-bold text-foreground">📦 Catalog</h1>
      <button
        onClick={() => !storeLocked && onOpenStoreModal()}
        className={`mt-0.5 flex items-center gap-1 text-xs ${
          storeLocked ? "text-muted-foreground cursor-default" : "text-primary hover:underline"
        }`}
      >
        <MapPin className="h-3 w-3" />
        {currentStore?.shortName ?? storeId}
        {storeLocked && <span className="ml-1 opacity-50">(locked)</span>}
      </button>
      <p className="text-xs text-muted-foreground">
        {loading ? "Loading…" : `${activeCount} of ${catalogSize} products active in the quiz`}
        {bulkSelectionSize > 0 && (
          <span className="ml-2 font-semibold text-primary">· {bulkSelectionSize} selected</span>
        )}
      </p>
    </div>
    <div className="flex gap-2 flex-wrap justify-end">
      {bulkSelectionSize > 0 && (
        <>
          <button
            onClick={onBulkDeactivate}
            className="flex items-center gap-1 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-400 active:scale-95"
          >
            <PowerOff className="h-3 w-3" /> Deactivate
          </button>
          <button
            onClick={onBulkActivate}
            className="flex items-center gap-1 rounded-xl border border-green-500/40 bg-green-500/10 px-3 py-2 text-xs text-green-400 active:scale-95"
          >
            <Power className="h-3 w-3" /> Activate
          </button>
          <button
            onClick={onOpenSendModal}
            className="flex items-center gap-1 rounded-xl border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs text-sky-400 active:scale-95"
          >
            <MapPin className="h-3 w-3" /> Send to store
          </button>
          <button
            onClick={onClearBulkSelection}
            className="flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground active:scale-95"
          >
            <X className="h-3 w-3" /> Cancel
          </button>
        </>
      )}
      <button
        onClick={onRefresh}
        className="flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground active:scale-95"
      >
        <RotateCcw className="h-3 w-3" /> Refresh
      </button>
      <button
        onClick={onDownloadCsvTemplate}
        className="flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground active:scale-95"
      >
        <Download className="h-3 w-3" /> CSV Template
      </button>
      <label className="flex items-center gap-1 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-primary active:scale-95 cursor-pointer">
        <Upload className="h-3 w-3" /> Upload Prices
        <input
          type="file"
          accept=".csv"
          onChange={(e) => e.target.files?.[0] && onCsvUpload(e.target.files[0])}
          className="hidden"
        />
      </label>
      <button
        onClick={onOpenAnalytics}
        className="flex items-center gap-1 rounded-xl gradient-primary px-3 py-2 text-xs font-semibold text-white shadow-md shadow-primary/30 active:scale-95"
      >
        <BarChart2 className="h-3 w-3" /> Analytics
      </button>
      <button
        onClick={onOpenConsulente}
        className="flex items-center gap-1 rounded-xl border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs text-sky-400 active:scale-95"
      >
        <GraduationCap className="h-3 w-3" /> Consulente
      </button>
      <button
        onClick={onLogout}
        className="flex items-center gap-1 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive active:scale-95"
      >
        <LogOut className="h-3 w-3" /> Log out
      </button>
      <button
        onClick={onBackToQuiz}
        className="flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground active:scale-95"
      >
        <Home className="h-3 w-3" /> Quiz
      </button>
    </div>
  </motion.div>
);
