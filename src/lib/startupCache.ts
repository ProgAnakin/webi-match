const TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  ts: number;
}

function key(name: string) {
  return `wm_cache_${name}`;
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
