import { useMemo } from "react";

export type PerformanceTier = "high" | "mid" | "low";

/**
 * Detects device performance tier to adapt animations.
 *
 * Strategy (iOS doesn't expose deviceMemory, so we combine signals):
 *  - hardwareConcurrency: older iPads report 2 cores, modern ones 4–12
 *  - matchMedia prefers-reduced-motion: respect user accessibility setting
 *  - User-agent heuristic for very old iPad models (iOS < 14)
 *
 * Tiers:
 *  high → modern iPad (Air 4+, Pro, mini 6+): full animations
 *  mid  → iPad Air 2 / mini 4 / iPad 6th gen: reduced confetti
 *  low  → iPad Air 1 / mini 1-3 / very old: minimal animations
 */
export function useDevicePerformance(): PerformanceTier {
  return useMemo(() => {
    // Respect accessibility preference first
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "low";

    const cores = navigator.hardwareConcurrency ?? 4;

    // iOS UA heuristic for old iPads (iOS 12 and below)
    const ua = navigator.userAgent;
    const isVeryOldIPad = /iPad/.test(ua) && /OS (9|10|11|12)_/.test(ua);
    if (isVeryOldIPad || cores <= 2) return "low";

    if (cores <= 4) return "mid";
    return "high";
  }, []);
}
