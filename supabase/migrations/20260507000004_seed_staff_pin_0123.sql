-- ─────────────────────────────────────────────────────────────────────────────
-- Reset the staff PIN to a known fixed value ("0123") and clear any active
-- lockout windows so staff can log in immediately after this migration runs.
--
-- Why this migration exists:
--   The bcrypt hash in app_config can drift out of sync with what the staff
--   expect (deleted, never seeded, or replaced during testing). Keeping the
--   PIN value in source control is acceptable here because:
--     1. The kiosk is a physical in-store device, not internet-exposed.
--     2. The PIN only gates the on-screen Manager / Stats overlays, not the
--        Supabase database (which is protected by RLS independently).
--     3. The hash itself never appears in client bundles — only the result
--        of verify_staff_pin() is exposed via RPC.
--
-- To change the PIN later:
--   Run this in the Supabase SQL Editor (replacing 'NEW_PIN'):
--     UPDATE public.app_config
--     SET value = extensions.crypt('NEW_PIN', extensions.gen_salt('bf'))
--     WHERE key = 'staff_pin_hash';
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Ensure pgcrypto is installed in the Supabase-conventional 'extensions' schema.
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 2. Make sure the storage table exists (in case a fresh DB skips earlier mig).
CREATE TABLE IF NOT EXISTS public.app_config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'app_config' AND policyname = 'no_client_access'
  ) THEN
    CREATE POLICY "no_client_access" ON public.app_config AS RESTRICTIVE USING (false);
  END IF;
END $$;

-- 3. Force the staff_pin_hash to "0123". Each run produces a fresh salt, so
--    the stored hash differs even when the underlying PIN is identical.
INSERT INTO public.app_config (key, value)
VALUES ('staff_pin_hash', extensions.crypt('0123', extensions.gen_salt('bf')))
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 4. Clear recent failed attempts so an existing lockout doesn't prevent the
--    next legitimate login. Keeps the historical audit trail past 15 minutes.
DELETE FROM public.admin_access_log
WHERE created_at > now() - interval '15 minutes'
  AND success = false;
