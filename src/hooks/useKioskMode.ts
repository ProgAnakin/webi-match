import { useState, useEffect, useCallback } from "react";

const LOCK_KEY = "wb_kiosk_locked";

async function enterFullscreen() {
  try {
    if (document.fullscreenEnabled && !document.fullscreenElement) {
      await document.documentElement.requestFullscreen({ navigationUI: "hide" });
    }
  } catch {
    // iOS Safari doesn't support the Fullscreen API — fail silently.
  }
}

async function exitFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
  } catch { /* ignore */ }
}

export function useKioskMode() {
  const [isKioskLocked, setIsKioskLocked] = useState(
    () => localStorage.getItem(LOCK_KEY) === "true",
  );

  // On mount: if kiosk is locked, attempt fullscreen (hides browser chrome).
  useEffect(() => {
    if (localStorage.getItem(LOCK_KEY) === "true") enterFullscreen();
  }, []);

  const activateKiosk = useCallback(async () => {
    localStorage.setItem(LOCK_KEY, "true");
    setIsKioskLocked(true);
    await enterFullscreen();
  }, []);

  const deactivateKiosk = useCallback(async () => {
    localStorage.removeItem(LOCK_KEY);
    setIsKioskLocked(false);
    await exitFullscreen();
  }, []);

  return { isKioskLocked, activateKiosk, deactivateKiosk };
}
