import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useKioskMode, isStandaloneDisplay } from "@/hooks/useKioskMode";

const LOCK_KEY = "wb_kiosk_locked";

// jsdom doesn't implement matchMedia — install a controllable stub.
function mockMatchMedia(standalone: boolean) {
  Object.defineProperty(window, "matchMedia", {
    value: (query: string) => ({
      matches: standalone && (query.includes("standalone") || query.includes("fullscreen")),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
    configurable: true,
    writable: true,
  });
}

describe("useKioskMode", () => {
  beforeEach(() => {
    localStorage.clear();
    mockMatchMedia(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe("isStandaloneDisplay", () => {
    it("is true when the display-mode is standalone", () => {
      mockMatchMedia(true);
      expect(isStandaloneDisplay()).toBe(true);
    });

    it("is false in a normal browser tab", () => {
      mockMatchMedia(false);
      expect(isStandaloneDisplay()).toBe(false);
    });
  });

  it("starts locked when the persisted flag is set", () => {
    localStorage.setItem(LOCK_KEY, "true");
    const { result } = renderHook(() => useKioskMode());
    expect(result.current.isKioskLocked).toBe(true);
  });

  it("starts unlocked by default", () => {
    const { result } = renderHook(() => useKioskMode());
    expect(result.current.isKioskLocked).toBe(false);
  });

  it("activateKiosk locks and persists (standalone path needs no Fullscreen API)", async () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useKioskMode());
    await act(async () => { await result.current.activateKiosk(); });
    expect(result.current.isKioskLocked).toBe(true);
    expect(localStorage.getItem(LOCK_KEY)).toBe("true");
  });

  it("deactivateKiosk unlocks and clears storage", async () => {
    localStorage.setItem(LOCK_KEY, "true");
    const { result } = renderHook(() => useKioskMode());
    await act(async () => { await result.current.deactivateKiosk(); });
    expect(result.current.isKioskLocked).toBe(false);
    expect(localStorage.getItem(LOCK_KEY)).toBeNull();
  });

  it("exposes isStandalone so the UI can explain keyboard-safety", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useKioskMode());
    expect(result.current.isStandalone).toBe(true);
  });
});
