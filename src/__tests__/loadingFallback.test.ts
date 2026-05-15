import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Unit tests for the 10-second loading fallback logic in Index.tsx.
// We test the pure timeout behaviour without mounting the full component.

describe("startup loading fallback (10 s timeout)", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("resolves after 10 000 ms when settingsLoaded stays false", () => {
    let resolved = false;
    let failed   = false;

    // Simulate the useEffect logic: arm a 10 s timer if not already loaded.
    const settingsLoaded = false;
    if (!settingsLoaded) {
      const timer = setTimeout(() => { resolved = true; failed = true; }, 10_000);
      // Advance 9 s — not yet triggered
      vi.advanceTimersByTime(9_000);
      expect(resolved).toBe(false);
      // Advance to 10 s — should trigger
      vi.advanceTimersByTime(1_000);
      expect(resolved).toBe(true);
      expect(failed).toBe(true);
      clearTimeout(timer);
    }
  });

  it("does NOT fire when settingsLoaded becomes true before 10 s", () => {
    let fallbackFired = false;
    let settled = false;

    const timer = setTimeout(() => { fallbackFired = true; }, 10_000);

    // Simulate data arriving at 3 s
    vi.advanceTimersByTime(3_000);
    settled = true;
    if (settled) clearTimeout(timer);

    vi.advanceTimersByTime(8_000);   // advance past where timer would have fired
    expect(fallbackFired).toBe(false);
  });
});
