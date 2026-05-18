/** Trigger a short vibration on supported devices. Safe to call anywhere — falls back to no-op. */
export function haptic(ms: number): void {
  try { navigator.vibrate?.(ms); } catch { /* unsupported */ }
}
