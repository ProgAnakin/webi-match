import { useEffect, useRef } from "react";

/**
 * Keeps the iPad screen awake during the exhibition using the Screen Wake Lock API.
 * Automatically re-acquires the lock if the tab becomes visible again
 * (e.g. after the user briefly switches app).
 */
export function useWakeLock() {
  const lockRef = useRef<WakeLockSentinel | null>(null);

  const acquire = async () => {
    if (!("wakeLock" in navigator)) return;
    try {
      lockRef.current = await navigator.wakeLock.request("screen");
    } catch {
      // Silently ignore — device may not support it or be in low-power mode
    }
  };

  useEffect(() => {
    acquire();

    // Re-acquire after the tab becomes visible again
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") acquire();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      lockRef.current?.release();
    };
  }, []);
}
