import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "@/hooks/useDebounce";

describe("useDebounce", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("returns initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("hello", 300));
    expect(result.current).toBe("hello");
  });

  it("does not update before delay elapses", () => {
    const { result, rerender } = renderHook(({ v }) => useDebounce(v, 300), {
      initialProps: { v: "a" },
    });
    rerender({ v: "b" });
    vi.advanceTimersByTime(200);
    expect(result.current).toBe("a"); // still debounced
  });

  it("updates after delay elapses", () => {
    const { result, rerender } = renderHook(({ v }) => useDebounce(v, 300), {
      initialProps: { v: "a" },
    });
    rerender({ v: "b" });
    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current).toBe("b");
  });

  it("resets timer on rapid updates", () => {
    const { result, rerender } = renderHook(({ v }) => useDebounce(v, 300), {
      initialProps: { v: "a" },
    });
    rerender({ v: "b" });
    vi.advanceTimersByTime(200);
    rerender({ v: "c" });
    vi.advanceTimersByTime(200);
    expect(result.current).toBe("a"); // neither "b" nor "c" yet
    act(() => { vi.advanceTimersByTime(100); });
    expect(result.current).toBe("c");
  });
});
