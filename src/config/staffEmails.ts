// Staff emails that bypass the 1-hour-per-address participation cooldown.
//
// ⚠ Two-sided list — MUST be kept in sync with the Supabase Edge Function
// secret `WHITELIST_EMAILS` on `on-session-created`. The client-side list
// only affects the UI (skips the cooldown screen so staff can demo back-to-back);
// the actual anti-abuse rate limit is enforced server-side using
// `WHITELIST_EMAILS`. If you add a staff email here without also updating the
// secret, the kiosk will let them through but the Edge Function will still
// rate-limit their emails.
//
// To update:
//   1. Edit this file (lowercase, trim whitespace).
//   2. Supabase Dashboard → Edge Functions → on-session-created → Secrets →
//      WHITELIST_EMAILS = "email1@x.com,email2@y.com".
//   3. Redeploy the Edge Function so the secret is picked up.
//
// Long-term: migrate this to a `staff_emails` table with RLS so it can be
// managed through the manager dashboard.
export const COOLDOWN_BYPASS_EMAILS = new Set([
  "costanzo.annichini@gmail.com",
  "costatocb@gmail.com",
]);
