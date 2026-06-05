import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWakeLock } from "@/hooks/useWakeLock";

// jsdom has no Screen Wake Lock API, so we install a mock sentinel and drive it.
describe("useWakeLock", () => {
  const release = vi.fn();
  const request = vi.fn();

  beforeEach(() => {
    release.mockReset().mockResolvedValue(undefined);
    request.mockReset().mockResolvedValue({ release });
    Object.defineProperty(navigator, "wakeLock", {
      value: { request },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(navigator, "wakeLock");
  });

  it("requests a screen wake lock on mount", async () => {
    renderHook(() => useWakeLock());
    await act(async () => {}); // flush the async acquire()
    expect(request).toHaveBeenCalledWith("screen");
  });

  it("does not throw when the Wake Lock API is unavailable", async () => {
    Reflect.deleteProperty(navigator, "wakeLock");
    expect(() => renderHook(() => useWakeLock())).not.toThrow();
    await act(async () => {});
    expect(request).not.toHaveBeenCalled();
  });

  it("re-acquires the lock when the tab becomes visible again", async () => {
    renderHook(() => useWakeLock());
    await act(async () => {});
    request.mockClear();
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(request).toHaveBeenCalledWith("screen");
  });

  it("releases the lock and removes the listener on unmount", async () => {
    const removeSpy = vi.spyOn(document, "removeEventListener");
    const { unmount } = renderHook(() => useWakeLock());
    await act(async () => {}); // let acquire() resolve so the sentinel is stored
    unmount();
    expect(release).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
  });
});
