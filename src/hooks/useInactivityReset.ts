import { useEffect, useRef } from "react";

const INACTIVITY_TIMEOUT = 45_000; // 45s without touch → show warning
const WARNING_DURATION  = 10_000;  // 10s countdown before reset

interface UseInactivityResetOptions {
  enabled: boolean;
  onWarn: (secondsLeft: number) => void;
  onReset: () => void;
}

export function useInactivityReset({ enabled, onWarn, onReset }: UseInactivityResetOptions) {
  // Keep latest callbacks in refs so the effect never needs to re-run when they change.
  // This prevents the common bug where inline handlers cause the 45s timer to restart
  // every render (e.g. every second during the countdown).
  const onWarnRef  = useRef(onWarn);
  const onResetRef = useRef(onReset);
  onWarnRef.current  = onWarn;
  onResetRef.current = onReset;

  useEffect(() => {
    if (!enabled) return;

    let inactivityTimer: ReturnType<typeof setTimeout>  | null = null;
    let countdownTimer:  ReturnType<typeof setInterval> | null = null;
    let isWarning = false;

    const clearAll = () => {
      if (inactivityTimer) { clearTimeout(inactivityTimer);   inactivityTimer = null; }
      if (countdownTimer)  { clearInterval(countdownTimer);   countdownTimer  = null; }
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
    };
  }, [enabled]); // only re-run when enabled changes (quiz start / return to welcome)
}
