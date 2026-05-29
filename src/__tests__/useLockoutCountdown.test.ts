import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLockoutCountdown } from "@/hooks/useLockoutCountdown";

// The countdown drives the visible 1 Hz badge for a server-enforced PIN
// lockout. The lockout itself lives server-side; this hook only animates the
// remaining seconds, so the tests focus on the decrement / clear transitions.
beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe("useLockoutCountdown", () => {
  it("starts unlocked at zero", () => {
    const { result } = renderHook(() => useLockoutCountdown());
    expect(result.current.lockedSeconds).toBe(0);
    expect(result.current.isLocked).toBe(false);
  });

  it("reports isLocked once a positive value is set", () => {
    const { result } = renderHook(() => useLockoutCountdown());
    act(() => { result.current.setLockedSeconds(30); });
    expect(result.current.lockedSeconds).toBe(30);
    expect(result.current.isLocked).toBe(true);
  });

  it("decrements one second per tick", () => {
    const { result } = renderHook(() => useLockoutCountdown());
    act(() => { result.current.setLockedSeconds(3); });
    act(() => { vi.advanceTimersByTime(1000); });
    expect(result.current.lockedSeconds).toBe(2);
    act(() => { vi.advanceTimersByTime(1000); });
    expect(result.current.lockedSeconds).toBe(1);
  });

  it("clears to zero and unlocks when the countdown elapses", () => {
    const { result } = renderHook(() => useLockoutCountdown());
    act(() => { result.current.setLockedSeconds(2); });
    act(() => { vi.advanceTimersByTime(2000); });
    expect(result.current.lockedSeconds).toBe(0);
    expect(result.current.isLocked).toBe(false);
  });

  it("does not go negative if extra time passes", () => {
    const { result } = renderHook(() => useLockoutCountdown());
    act(() => { result.current.setLockedSeconds(1); });
    act(() => { vi.advanceTimersByTime(5000); });
    expect(result.current.lockedSeconds).toBe(0);
  });

  it("restarts cleanly when a new lockout arrives mid-countdown", () => {
    const { result } = renderHook(() => useLockoutCountdown());
    act(() => { result.current.setLockedSeconds(3); });
    act(() => { vi.advanceTimersByTime(1000); }); // → 2
    expect(result.current.lockedSeconds).toBe(2);
    // Server returns a fresh, longer lockout (e.g. another failed attempt).
    act(() => { result.current.setLockedSeconds(10); });
    act(() => { vi.advanceTimersByTime(1000); });
    expect(result.current.lockedSeconds).toBe(9);
  });

  it("never starts a timer for a zero lockout", () => {
    const { result } = renderHook(() => useLockoutCountdown());
    act(() => { result.current.setLockedSeconds(0); });
    act(() => { vi.advanceTimersByTime(3000); });
    expect(result.current.lockedSeconds).toBe(0);
    expect(result.current.isLocked).toBe(false);
  });

  it("stops ticking after unmount (no dangling interval)", () => {
    const { result, unmount } = renderHook(() => useLockoutCountdown());
    act(() => { result.current.setLockedSeconds(5); });
    unmount();
    // If the interval leaked, advancing timers would throw on a stale setState.
    expect(() => { vi.advanceTimersByTime(5000); }).not.toThrow();
  });
});
