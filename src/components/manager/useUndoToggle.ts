import { useCallback, useEffect, useRef, useState } from "react";
import type { UndoEntry } from "./managerDashboardUtils";

const UNDO_WINDOW_SECONDS = 8;

/**
 * Encapsulates the 8-second "Undo last change" snackbar that the catalog
 * shows after a single product toggle. The caller arms the window after a
 * successful save and supplies the revert action.
 */
export const useUndoToggle = (revert: (entry: UndoEntry) => Promise<void> | void) => {
  const [entry, setEntry] = useState<UndoEntry | null>(null);
  const [countdown, setCountdown] = useState(UNDO_WINDOW_SECONDS);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const arm = useCallback((next: UndoEntry) => {
    clearTimers();
    setEntry(next);
    setCountdown(UNDO_WINDOW_SECONDS);

    let remaining = UNDO_WINDOW_SECONDS;
    intervalRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0 && intervalRef.current) clearInterval(intervalRef.current);
    }, 1000);

    timeoutRef.current = setTimeout(() => {
      setEntry(null);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }, UNDO_WINDOW_SECONDS * 1000);
  }, [clearTimers]);

  const trigger = useCallback(async () => {
    if (!entry) return;
    clearTimers();
    const current = entry;
    setEntry(null);
    await revert(current);
  }, [entry, clearTimers, revert]);

  useEffect(() => clearTimers, [clearTimers]);

  return { entry, countdown, arm, trigger };
};
