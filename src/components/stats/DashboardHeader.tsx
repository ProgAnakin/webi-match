import { motion } from "framer-motion";
import { Calendar, ChevronDown, ChevronUp, Download, Home, LogOut, Package, RefreshCw, Shield, ShieldCheck } from "lucide-react";

interface DashboardHeaderProps {
  isFiltered: boolean;
  showFilters: boolean;
  exportDisabled: boolean;
  hasMfa: boolean;
  onRefresh: () => void;
  onToggleFilters: () => void;
  onExport: () => void;
  onOpenCatalog: () => void;
  onOpenMfa: () => void;
  onLogout: () => void;
  onBackToQuiz: () => void;
}

export const DashboardHeader = ({
  isFiltered, showFilters, exportDisabled, hasMfa,
  onRefresh, onToggleFilters, onExport, onOpenCatalog, onOpenMfa, onLogout, onBackToQuiz,
}: DashboardHeaderProps) => (
  <motion.div
    className="flex items-center justify-between"
    initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
  >
    <div>
      <h1 className="text-2xl font-bold text-foreground">📊 Analytics</h1>
      <p className="text-xs text-muted-foreground">Real-time data · Suaipe</p>
    </div>
    <div className="flex flex-wrap gap-2 justify-end">
      <button
        onClick={onRefresh}
        className="flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground active:scale-95"
      >
        <RefreshCw className="h-3 w-3" /> Refresh
      </button>
      <button
        onClick={onToggleFilters}
        className={`flex items-center gap-1 rounded-xl border px-3 py-2 text-xs active:scale-95 ${
          isFiltered
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-border bg-card text-muted-foreground"
        }`}
      >
        <Calendar className="h-3 w-3" />
        {isFiltered ? "Filter active" : "Filter"}
        {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      <button
        onClick={onExport}
        disabled={exportDisabled}
        className="flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground active:scale-95 disabled:opacity-40"
      >
        <Download className="h-3 w-3" /> CSV
      </button>
      <button
        onClick={onOpenCatalog}
        className="flex items-center gap-1 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-primary active:scale-95"
      >
        <Package className="h-3 w-3" /> Catalog
      </button>
      <button
        onClick={onOpenMfa}
        title={hasMfa ? "2FA active" : "Set up 2FA"}
        className={`flex items-center gap-1 rounded-xl border px-3 py-2 text-xs active:scale-95 ${
          hasMfa
            ? "border-green-500/40 bg-green-500/10 text-green-400"
            : "border-border bg-card text-muted-foreground"
        }`}
      >
        {hasMfa ? <ShieldCheck className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
        2FA
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
