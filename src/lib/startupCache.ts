const TTL_MS = 5 * 60 * 1000; // 5 minutes

// Bump this whenever the cache schema changes incompatibly.
const CACHE_VERSION = "2";
const VERSION_KEY = "wm_cache_version";

interface CacheEntry<T> {
  data: T;
  ts: number;
}

function key(name: string) {
  return `wm_cache_${name}`;
}

/** Called once at startup — wipes all wm_cache_* entries if the version changed. */
export function checkCacheIntegrity(): void {
  try {
    const stored = localStorage.getItem(VERSION_KEY);
    if (stored !== CACHE_VERSION) {
      // Purge stale entries from previous schema
      const keys = Object.keys(localStorage).filter((k) => k.startsWith("wm_cache_"));
      keys.forEach((k) => localStorage.removeItem(k));
      localStorage.setItem(VERSION_KEY, CACHE_VERSION);
    }
  } catch {
    // Private browsing or quota issues — ignore
  }
}

export function readCache<T>(name: string): T | null {
  try {
    const raw = localStorage.getItem(key(name));
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() - entry.ts > TTL_MS) return null;
    return entry.data;
  } catch {
    return null;
  }
}

export function writeCache<T>(name: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, ts: Date.now() };
    localStorage.setItem(key(name), JSON.stringify(entry));
  } catch {
    // Quota exceeded or private browsing — silently ignore.
  }
}

export function clearCache(name: string): void {
  try { localStorage.removeItem(key(name)); } catch { /* ignore */ }
}
