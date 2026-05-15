import { describe, it, expect, beforeEach } from "vitest";
import { checkCacheIntegrity, readCache, writeCache, clearCache } from "@/lib/startupCache";

// Use a fresh localStorage-like store per test
beforeEach(() => {
  localStorage.clear();
});

describe("writeCache / readCache", () => {
  it("stores and retrieves a value", () => {
    writeCache("test", { x: 1 });
    expect(readCache("test")).toEqual({ x: 1 });
  });

  it("returns null after TTL expires", () => {
    writeCache("old", "data");
    // Manually corrupt the timestamp to simulate expiry
    const raw = localStorage.getItem("wm_cache_old")!;
    const entry = JSON.parse(raw);
    entry.ts = Date.now() - 6 * 60 * 1000; // 6 min ago > 5 min TTL
    localStorage.setItem("wm_cache_old", JSON.stringify(entry));
    expect(readCache("old")).toBeNull();
  });

  it("returns null for unknown key", () => {
    expect(readCache("missing")).toBeNull();
  });

  it("clearCache removes the entry", () => {
    writeCache("bye", 42);
    clearCache("bye");
    expect(readCache("bye")).toBeNull();
  });
});

describe("checkCacheIntegrity", () => {
  it("purges all wm_cache_* entries when version is stale", () => {
    // Seed old-version cache entries
    localStorage.setItem("wm_cache_foo", JSON.stringify({ data: "stale", ts: Date.now() }));
    localStorage.setItem("wm_cache_bar", JSON.stringify({ data: "stale2", ts: Date.now() }));
    localStorage.setItem("wm_cache_version", "0"); // old version

    checkCacheIntegrity();

    // Entries should be purged
    expect(localStorage.getItem("wm_cache_foo")).toBeNull();
    expect(localStorage.getItem("wm_cache_bar")).toBeNull();
    // Version should be updated
    expect(localStorage.getItem("wm_cache_version")).toBe("2");
  });

  it("keeps cache entries when version matches", () => {
    localStorage.setItem("wm_cache_version", "2");
    localStorage.setItem("wm_cache_keep", JSON.stringify({ data: "ok", ts: Date.now() }));

    checkCacheIntegrity();

    expect(localStorage.getItem("wm_cache_keep")).not.toBeNull();
  });
});
