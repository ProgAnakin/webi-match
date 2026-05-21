import { useState, useEffect, useCallback } from "react";

const LOCK_KEY = "wb_kiosk_locked";

// True when the app runs as an installed PWA ("Add to Home Screen") or already
// in a fullscreen display-mode. In that case the browser chrome is already gone
// — and, crucially, the iOS soft keyboard does NOT dismiss it. The Fullscreen
// API is only needed (and only fragile) inside a normal Safari tab.
//
// iOS Safari, in a plain tab, FORCIBLY exits Fullscreen API the moment a text
// input focuses and the soft keyboard appears. There is no pure-web way around
// that — the robust kiosk setup is to install the app to the Home Screen and
// launch it from the icon, which lands here in standalone mode.
export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const mql =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.matchMedia?.("(display-mode: fullscreen)").matches;
  const iosStandalone =
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return Boolean(mql || iosStandalone);
}

// Returns true when the kiosk is logically engaged: fullscreen succeeded, the
// API is unsupported, or the app is already standalone (nothing to hide).
async function enterFullscreen(): Promise<boolean> {
  // Standalone PWA — no chrome to hide. Skipping the Fullscreen API also avoids
  // the iOS "keyboard kicks you out of fullscreen" failure mode entirely.
  if (isStandaloneDisplay()) return true;
  if (!document.fullscreenEnabled) return true; // unsupported — treat as logical kiosk
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
  const standalone = isStandaloneDisplay();

  // On mount: if kiosk is locked, attempt fullscreen (hides browser chrome).
  // No-op when standalone.
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

  // `isStandalone` lets the UI explain WHY kiosk mode is or isn't keyboard-safe.
  return { isKioskLocked, activateKiosk, deactivateKiosk, isStandalone: standalone };
}
