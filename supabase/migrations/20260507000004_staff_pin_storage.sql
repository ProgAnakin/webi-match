-- Staff PIN storage — infrastructure only. No PIN value is committed.
--
-- The staff PIN is verified by the `verify-pin` Edge Function. The PRIMARY
-- source is the `STAFF_PIN` Edge Function secret. This table is only the
-- FALLBACK (a bcrypt hash in app_config), used when that secret is absent.
--
-- To set or rotate the fallback hash, run this once in the Supabase SQL
-- Editor with your own value — never commit a real PIN to source control:
--
--   INSERT INTO public.app_config (key, value)
--   VALUES ('staff_pin_hash',
--           extensions.crypt('YOUR_PIN', extensions.gen_salt('bf')))
--   ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- pgcrypto in the Supabase-conventional 'extensions' schema (for crypt()).
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Key/value config table. RLS denies all client access — only SECURITY
-- DEFINER functions (verify_staff_pin) and the service role may read it.
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
