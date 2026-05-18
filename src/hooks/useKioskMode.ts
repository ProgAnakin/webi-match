import { useState, useEffect, useCallback } from "react";

const LOCK_KEY = "wb_kiosk_locked";

// Returns true when fullscreen is engaged OR unsupported (iOS Safari).
// Returns false only when the API is available and the user actively denied the request,
// so the caller can keep the kiosk state in sync with the actual screen state.
async function enterFullscreen(): Promise<boolean> {
  if (!document.fullscreenEnabled) return true; // unsupported — treat as "kiosk logical" without chrome
  if (document.fullscreenElement) return true;
  try {
    await document.documentElement.requestFullscreen({ navigationUI: "hide" });
    return true;
  } catch {
    return false;
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
    const ok = await enterFullscreen();
    if (!ok) return;
    localStorage.setItem(LOCK_KEY, "true");
    setIsKioskLocked(true);
  }, []);

  const deactivateKiosk = useCallback(async () => {
    localStorage.removeItem(LOCK_KEY);
    setIsKioskLocked(false);
    await exitFullscreen();
  }, []);

  return { isKioskLocked, activateKiosk, deactivateKiosk };
}
