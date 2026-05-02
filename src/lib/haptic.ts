export function haptic(ms: number): void {
  try { navigator.vibrate?.(ms); } catch { /* unsupported */ }
}
