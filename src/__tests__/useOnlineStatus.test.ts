import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

describe("useOnlineStatus", () => {
  const listeners: Record<string, EventListener[]> = {};

  beforeEach(() => {
    vi.spyOn(window, "addEventListener").mockImplementation((ev, fn) => {
      (listeners[ev] ??= []).push(fn as EventListener);
    });
    vi.spyOn(window, "removeEventListener").mockImplementation((ev, fn) => {
      listeners[ev] = (listeners[ev] ?? []).filter((f) => f !== fn);
    });
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true, writable: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.keys(listeners).forEach((k) => { listeners[k] = []; });
  });

  it("returns true when navigator.onLine is true", () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);
  });

  it("returns false when navigator.onLine is false", () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);
  });

  it("switches to false when offline event fires", () => {
    const { result } = renderHook(() => useOnlineStatus());
    act(() => { (listeners["offline"] ?? []).forEach((fn) => fn(new Event("offline"))); });
    expect(result.current).toBe(false);
  });

  it("switches back to true when online event fires", () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    const { result } = renderHook(() => useOnlineStatus());
    act(() => { (listeners["online"] ?? []).forEach((fn) => fn(new Event("online"))); });
    expect(result.current).toBe(true);
  });

  it("removes event listeners on unmount", () => {
    const { unmount } = renderHook(() => useOnlineStatus());
    unmount();
    expect(listeners["online"] ?? []).toHaveLength(0);
    expect(listeners["offline"] ?? []).toHaveLength(0);
  });
});
