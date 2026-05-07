import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useInactivityReset } from "@/hooks/useInactivityReset";

// Freeze real timers and replace with fake ones for each test.
beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

const TIMEOUT = 5_000;
const WARNING = 3_000;

// Patch the module-level constants so tests run in milliseconds, not 45 s.
vi.mock("@/config/timings", () => ({
  INACTIVITY_TIMEOUT_MS: 5_000,
  WARNING_DURATION_MS:   3_000,
  RESULT_INACTIVITY_TIMEOUT_MS: 90_000,
  ADMIN_IDLE_TIMEOUT_MS: 600_000,
}));

function setup(enabled = true) {
  const onWarn   = vi.fn();
  const onReset  = vi.fn();
  const onDismiss = vi.fn();
  const { result, unmount } = renderHook(() =>
    useInactivityReset({ enabled, onWarn, onReset, onDismiss, timeout: TIMEOUT })
  );
  return { result, onWarn, onReset, onDismiss, unmount };
}

describe("useInactivityReset", () => {
  it("calls onWarn after inactivity timeout", () => {
    const { onWarn } = setup();
    act(() => { vi.advanceTimersByTime(TIMEOUT); });
    expect(onWarn).toHaveBeenCalledWith(WARNING / 1000);
  });

  it("calls onReset after inactivity + full warning countdown", () => {
    const { onReset } = setup();
    act(() => { vi.advanceTimersByTime(TIMEOUT + WARNING); });
    expect(onReset).toHaveBeenCalledOnce();
  });

  it("does NOT fire when disabled", () => {
    const { onWarn, onReset } = setup(false);
    act(() => { vi.advanceTimersByTime(TIMEOUT + WARNING + 1000); });
    expect(onWarn).not.toHaveBeenCalled();
    expect(onReset).not.toHaveBeenCalled();
  });

  it("resets the inactivity timer on user activity", () => {
    const { onWarn } = setup();
    act(() => { vi.advanceTimersByTime(TIMEOUT - 100); });
    // Fire an activity event — this should restart the timer
    act(() => { window.dispatchEvent(new MouseEvent("mousedown")); });
    act(() => { vi.advanceTimersByTime(TIMEOUT - 100); });
    // Should NOT have warned yet (timer was reset)
    expect(onWarn).not.toHaveBeenCalled();
  });

  it("calls onDismiss when activity interrupts an active countdown", () => {
    const { onWarn, onDismiss } = setup();
    // Advance past inactivity into warning phase
    act(() => { vi.advanceTimersByTime(TIMEOUT + 1000); });
    expect(onWarn).toHaveBeenCalled();
    // User interacts — should dismiss
    act(() => { window.dispatchEvent(new MouseEvent("mousedown")); });
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("dismiss() re-arms the inactivity timer", () => {
    const { result, onWarn } = setup();
    act(() => { vi.advanceTimersByTime(TIMEOUT); });
    const callsBefore = onWarn.mock.calls.length;
    // Dismiss manually
    act(() => { result.current.dismiss(); });
    // Re-arm: should not warn until another TIMEOUT passes
    act(() => { vi.advanceTimersByTime(TIMEOUT - 100); });
    expect(onWarn.mock.calls.length).toBe(callsBefore);
  });

  it("cleans up timers on unmount", () => {
    const { unmount, onReset } = setup();
    unmount();
    act(() => { vi.advanceTimersByTime(TIMEOUT + WARNING + 1000); });
    expect(onReset).not.toHaveBeenCalled();
  });
});
