import { useEffect, useRef, useCallback } from "react";

const INACTIVITY_TIMEOUT = 45_000; // 45s without touch → show warning
const WARNING_DURATION  = 10_000;  // 10s countdown before reset

interface UseInactivityResetOptions {
  enabled: boolean;
  onWarn: (secondsLeft: number) => void;
  onReset: () => void;
}

export function useInactivityReset({ enabled, onWarn, onReset }: UseInactivityResetOptions) {
  // Refs for callbacks — updated every render but never in dependency arrays.
  // This is the key fix: inline handlers like `(s) => setState(s)` are new
  // objects on every render; putting them in deps makes useEffect re-run and
  // restart the 45-second timer every second during the countdown.
  const onWarnRef  = useRef(onWarn);
  const onResetRef = useRef(onReset);
  onWarnRef.current  = onWarn;
  onResetRef.current = onReset;

  // arm() is defined inside the effect but exposed via this ref so dismiss()
  // can call it without being coupled to the effect lifecycle.
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

    // expose arm so dismiss() can call it from outside the effect
    armRef.current = arm;

    const handleActivity = () => {
      if (isWarning) { clearAll(); isWarning = false; }
      arm();
    };

    const EVENTS = ["touchstart", "touchmove", "mousedown", "mousemove", "keydown", "scroll"] as const;
    EVENTS.forEach(e => window.addEventListener(e, handleActivity, { passive: true }));
    arm(); // start on mount

    return () => {
      EVENTS.forEach(e => window.removeEventListener(e, handleActivity));
      clearAll();
      armRef.current = () => {};
    };
  }, [enabled]); // only re-run when enabled changes

  // dismiss(): user tapped "still here" → hide overlay + restart 45s timer
  const dismiss = useCallback(() => {
    armRef.current();
  }, []);

  return { dismiss };
}
