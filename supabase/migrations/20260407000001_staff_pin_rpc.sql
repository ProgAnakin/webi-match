-- ─────────────────────────────────────────────────────────────────────────────
-- Staff PIN verification — server-side via RPC
-- Moves PIN validation out of the client bundle entirely.
--
-- HOW TO USE:
--   1. Run this migration in the Supabase SQL Editor.
--   2. Then run the INSERT below to store the hashed PIN, replacing '1234'
--      with your actual PIN:
--
--        INSERT INTO app_config (key, value)
--        VALUES ('staff_pin_hash', crypt('YOUR_PIN_HERE', gen_salt('bf')))
--        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
--
--   3. Remove VITE_STAFF_PIN from your Vercel environment variables.
-- ─────────────────────────────────────────────────────────────────────────────

-- pgcrypto provides crypt() and gen_salt() for bcrypt hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Generic key-value config table (not exposed to clients via RLS)
CREATE TABLE IF NOT EXISTS public.app_config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Only the Supabase service role can read/write app_config directly.
-- The RPC below uses SECURITY DEFINER so it runs with elevated privileges.
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "no_client_access" ON public.app_config AS RESTRICTIVE
  USING (false);

-- RPC: verify_staff_pin(pin_input)
-- Returns TRUE if the input matches the stored bcrypt hash, FALSE otherwise.
-- Rate-limiting is enforced at the app level (MAX_ATTEMPTS + lockout).
CREATE OR REPLACE FUNCTION public.verify_staff_pin(pin_input text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_hash text;
BEGIN
  SELECT value INTO stored_hash FROM app_config WHERE key = 'staff_pin_hash';
  IF stored_hash IS NULL THEN
    RETURN false; -- no PIN configured yet
  END IF;
  RETURN stored_hash = crypt(pin_input, stored_hash);
END;
$$;

-- Allow any authenticated or anonymous caller to invoke the RPC
-- (the PIN itself is never returned — only a boolean)
GRANT EXECUTE ON FUNCTION public.verify_staff_pin(text) TO anon, authenticated;
