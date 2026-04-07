import { products } from "@/data/products";
import { getStoreById } from "@/data/stores";

// ─── Domain types ─────────────────────────────────────────────────────────────

export interface QuizSession {
  id: string;
  email: string;
  matched_product_id: string;
  match_percent: number;
  created_at: string;
  store_id: string | null;
}

export interface DayCount {
  day: string;
  date: string;
  count: number;
}

export interface ProductStat {
  id: string;
  name: string;
  count: number;
  percent: number;
}

export interface FunnelCounts {
  started: number;
  resultShown: number;
  claimed: number;
}

export type AuthStep = "login" | "mfa" | "dashboard";

// ─── Utilities ────────────────────────────────────────────────────────────────

export const DAY_LABELS = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

export function productName(id: string): string {
  return products.find((p) => p.id === id)?.name ?? id;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("it-IT", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

export function storeName(id: string | null): string {
  if (!id) return "—";
  return getStoreById(id)?.shortName ?? id;
}

/**
 * Sanitize a string for safe CSV embedding.
 * - Escapes double quotes (RFC 4180)
 * - Strips CR/LF to prevent row injection
 * - Prefixes formula-triggering characters (=, +, -, @, |, %) with a tab
 *   to neutralise spreadsheet formula injection (OWASP CSV injection)
 */
function csvSafe(value: string): string {
  const stripped = value.replace(/[\r\n]/g, " ");
  const escaped = stripped.replace(/"/g, '""');
  return /^[=+\-@|%]/.test(escaped) ? `\t${escaped}` : escaped;
}

export function exportCSV(
  sessions: QuizSession[],
  fromDate?: string,
  toDate?: string,
): void {
  const header = ["Email", "Prodotto", "Match %", "Sede", "Data"];
  const rows = sessions.map((s) => [
    `"${csvSafe(s.email)}"`,
    `"${csvSafe(productName(s.matched_product_id))}"`,
    s.match_percent,
    `"${csvSafe(storeName(s.store_id))}"`,
    `"${new Date(s.created_at).toLocaleString("it-IT")}"`,
  ]);
  const csv = [header, ...rows].map((r) => r.join(";")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const suffix = fromDate && toDate ? `_${fromDate}_a_${toDate}` : "";
  a.download = `webi-match${suffix}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
