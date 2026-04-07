import { useEffect, useRef, useCallback } from "react";
import { INACTIVITY_TIMEOUT_MS, WARNING_DURATION_MS } from "@/config/timings";

const INACTIVITY_TIMEOUT = INACTIVITY_TIMEOUT_MS;
const WARNING_DURATION   = WARNING_DURATION_MS;

interface UseInactivityResetOptions {
  enabled: boolean;
  onWarn: (secondsLeft: number) => void;
  onReset: () => void;
  /** Called when a user interaction cancels the warning (before the reset fires).
   *  Use this to hide the overlay without restarting the whole flow. */
  onDismiss?: () => void;
}

export function useInactivityReset({ enabled, onWarn, onReset, onDismiss }: UseInactivityResetOptions) {
  const onWarnRef    = useRef(onWarn);
  const onResetRef   = useRef(onReset);
  const onDismissRef = useRef(onDismiss);
  onWarnRef.current    = onWarn;
  onResetRef.current   = onReset;
  onDismissRef.current = onDismiss;

  // arm() is defined inside the effect but exposed so dismiss() can call it.
  const armRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!enabled) {
      armRef.current = () => {};
      return;
    }

    let inactivityTimer: ReturnType<typeof setTimeout>  | null = null;
    let countdownTimer:  ReturnType<typeof setInterval> | null = null;
    let isWarning = false;

    const clearAll = () => {
      if (inactivityTimer) { clearTimeout(inactivityTimer);  inactivityTimer = null; }
      if (countdownTimer)  { clearInterval(countdownTimer);  countdownTimer  = null; }
    };

    const startCountdown = () => {
      isWarning = true;
      let secondsLeft = Math.round(WARNING_DURATION / 1000);
      onWarnRef.current(secondsLeft);

      countdownTimer = setInterval(() => {
        secondsLeft -= 1;
        if (secondsLeft <= 0) {
          clearAll();
          isWarning = false;
          onResetRef.current();
        } else {
          onWarnRef.current(secondsLeft);
        }
      }, 1000);
    };

    const arm = () => {
      clearAll();
      isWarning = false;
      inactivityTimer = setTimeout(startCountdown, INACTIVITY_TIMEOUT);
    };

    armRef.current = arm;

    const handleActivity = () => {
      if (isWarning) {
        // Countdown was running — user came back. Stop it and notify parent
        // so the overlay disappears (without this call, it stays frozen on screen).
        clearAll();
        isWarning = false;
        onDismissRef.current?.();
      }
      arm();
    };

    // touchstart / touchmove cover all iPad interactions.
    // mousedown / keydown / scroll cover desktop testing.
    // mousemove intentionally omitted: hovering alone shouldn't cancel the timer
    // (on the kiosk iPad there is no mouse; on desktop it caused the overlay to
    // freeze rather than dismiss because it fired handleActivity without clicking).
    const EVENTS = ["touchstart", "touchmove", "mousedown", "keydown", "scroll"] as const;
    EVENTS.forEach(e => window.addEventListener(e, handleActivity, { passive: true }));
    arm();

    return () => {
      EVENTS.forEach(e => window.removeEventListener(e, handleActivity));
      clearAll();
      armRef.current = () => {};
    };
  }, [enabled]);

  /** Call this to dismiss the overlay manually (e.g. "Sono ancora qui!" button). */
  const dismiss = useCallback(() => {
    armRef.current();
  }, []);

  return { dismiss };
}
