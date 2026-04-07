import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// ── Safety checks ────────────────────────────────────────────────────────────
// Fail fast if required env vars are missing — prevents silent runtime errors.
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    '[webi-match] Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. '
    + 'Check your .env file or Vercel environment variables.',
  );
}

// Block accidental use of the service-role key in client code.
// Service-role keys bypass RLS and must NEVER reach the browser.
if (
  SUPABASE_PUBLISHABLE_KEY.startsWith('sbp_') ||
  SUPABASE_PUBLISHABLE_KEY.length > 300
) {
  throw new Error(
    '[webi-match] CRITICAL — a service-role key was detected in VITE_SUPABASE_PUBLISHABLE_KEY. '
    + 'Only the anon/publishable key (eyJ…) is safe for the browser.',
  );
}

// ── Client ───────────────────────────────────────────────────────────────────
// sessionStorage clears when the tab closes — limits exposure on shared kiosks.
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: sessionStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
