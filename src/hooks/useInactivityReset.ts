import { useEffect, useRef, useCallback } from "react";

const INACTIVITY_TIMEOUT = 45_000; // 45s senza tocco → mostra avviso
const WARNING_DURATION = 10_000;   // 10s di conto alla rovescia prima del reset

interface UseInactivityResetOptions {
  enabled: boolean;
  onWarn: (secondsLeft: number) => void;
  onReset: () => void;
}

export function useInactivityReset({ enabled, onWarn, onReset }: UseInactivityResetOptions) {
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const isWarningActive = useRef(false);

  const clearTimers = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
    inactivityTimer.current = null;
    countdownTimer.current = null;
  }, []);

  const startCountdown = useCallback(() => {
    isWarningActive.current = true;
    let secondsLeft = Math.round(WARNING_DURATION / 1000);
    onWarn(secondsLeft);

    countdownTimer.current = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft <= 0) {
        clearTimers();
        isWarningActive.current = false;
        onReset();
      } else {
        onWarn(secondsLeft);
      }
    }, 1000);
  }, [onWarn, onReset, clearTimers]);

  const resetTimer = useCallback(() => {
    if (!enabled) return;
    clearTimers();
    isWarningActive.current = false;
    inactivityTimer.current = setTimeout(startCountdown, INACTIVITY_TIMEOUT);
  }, [enabled, clearTimers, startCountdown]);

  // Reinicia o timer a cada interação do utilizador
  useEffect(() => {
    if (!enabled) {
      clearTimers();
      return;
    }

    const events = ["touchstart", "touchmove", "mousedown", "mousemove", "keydown", "scroll"];
    const handleActivity = () => {
      if (isWarningActive.current) {
        // Utilizador voltou durante o avviso — cancella e ricomincia
        clearTimers();
        isWarningActive.current = false;
      }
      resetTimer();
    };

    events.forEach((e) => window.addEventListener(e, handleActivity, { passive: true }));
    resetTimer(); // inicia ao montar

    return () => {
      events.forEach((e) => window.removeEventListener(e, handleActivity));
      clearTimers();
    };
  }, [enabled, resetTimer, clearTimers]);
}
