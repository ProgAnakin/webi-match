// Staff emails that bypass the 1-hour-per-address participation cooldown.
//
// The client-side list is cosmetic only — it skips the cooldown screen so
// staff can demo the kiosk back-to-back. The real anti-abuse rate limit is
// enforced server-side by the Edge Function secret `WHITELIST_EMAILS` on
// `on-session-created`.
//
// Provided via the VITE_COOLDOWN_BYPASS_EMAILS env var (comma-separated) so
// personal addresses are never committed to source control or the public
// bundle. Keep it in sync with the WHITELIST_EMAILS Edge Function secret.
const raw = (import.meta.env.VITE_COOLDOWN_BYPASS_EMAILS as string | undefined) ?? "";

export const COOLDOWN_BYPASS_EMAILS = new Set(
  raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean),
);
