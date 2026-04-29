-- ─────────────────────────────────────────────────────────────────────────────
-- Store-level role system for product_settings access control.
--
-- Model:
--   manager               → full CRUD on product_settings for ALL stores
--   consulente_responsabile → full CRUD on product_settings for THEIR store only
--
-- Setup after applying:
--   1. Create users in Supabase Auth (Dashboard → Authentication → Users)
--   2. INSERT into public.store_roles for each person
--   3. Manager example:
--        INSERT INTO public.store_roles (user_id, role)
--        VALUES ('<manager-uuid>', 'manager');
--   4. Consulente example:
--        INSERT INTO public.store_roles (user_id, role, store_id)
--        VALUES ('<consulente-uuid>', 'consulente_responsabile', 'corso-vercelli');
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Role table ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.store_roles (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text        NOT NULL CHECK (role IN ('manager', 'consulente_responsabile')),
  store_id   text        DEFAULT NULL,  -- NULL = all stores (manager only)
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id)  -- one role per user; adjust to allow multi-store later if needed
);

COMMENT ON COLUMN public.store_roles.store_id IS
  'NULL means access to all stores (manager). Set to a specific store_id for consulente_responsabile.';

-- Only the service role (backend/Edge Functions) can manage roles directly.
ALTER TABLE public.store_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roles_self_read" ON public.store_roles
  FOR SELECT USING (auth.uid() = user_id);
-- No INSERT/UPDATE/DELETE from client — managed via Supabase Dashboard or Edge Function.

-- ── 2. Helper function ────────────────────────────────────────────────────────
-- Returns the role record for the currently logged-in user.
-- SECURITY DEFINER so it can bypass RLS on store_roles itself.
CREATE OR REPLACE FUNCTION public.get_my_store_role()
RETURNS TABLE (role text, store_id text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT sr.role, sr.store_id
  FROM public.store_roles sr
  WHERE sr.user_id = auth.uid()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_store_role() TO authenticated;

-- ── 3. product_settings RLS ───────────────────────────────────────────────────
-- Drop any existing permissive policies before replacing them.
DO $$
BEGIN
  -- Drop old policies if they exist (idempotent re-apply)
  DROP POLICY IF EXISTS "staff_manage_product_settings" ON public.product_settings;
  DROP POLICY IF EXISTS "anon_read_product_settings"    ON public.product_settings;
  DROP POLICY IF EXISTS "authenticated_manage_product_settings" ON public.product_settings;
  DROP POLICY IF EXISTS "manager_all_stores"            ON public.product_settings;
  DROP POLICY IF EXISTS "consulente_own_store"          ON public.product_settings;
END $$;

-- Anon/public kiosk: read-only, no store filter (product catalog is not secret)
CREATE POLICY "anon_read_product_settings"
  ON public.product_settings
  FOR SELECT
  TO anon
  USING (true);

-- Manager: full access to every store
CREATE POLICY "manager_all_stores"
  ON public.product_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.store_roles sr
      WHERE sr.user_id = auth.uid()
        AND sr.role = 'manager'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.store_roles sr
      WHERE sr.user_id = auth.uid()
        AND sr.role = 'manager'
    )
  );

-- Consulente: full access to their assigned store only
CREATE POLICY "consulente_own_store"
  ON public.product_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.store_roles sr
      WHERE sr.user_id = auth.uid()
        AND sr.role = 'consulente_responsabile'
        AND sr.store_id = product_settings.store_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.store_roles sr
      WHERE sr.user_id = auth.uid()
        AND sr.role = 'consulente_responsabile'
        AND sr.store_id = product_settings.store_id
    )
  );

-- ── 4. quiz_sessions — managers + consulenti can read sessions for their store ─
DO $$
BEGIN
  DROP POLICY IF EXISTS "staff_read_quiz_sessions"  ON public.quiz_sessions;
  DROP POLICY IF EXISTS "manager_read_sessions"     ON public.quiz_sessions;
  DROP POLICY IF EXISTS "consulente_read_sessions"  ON public.quiz_sessions;
END $$;

CREATE POLICY "manager_read_sessions"
  ON public.quiz_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.store_roles sr
      WHERE sr.user_id = auth.uid()
        AND sr.role = 'manager'
    )
  );

CREATE POLICY "consulente_read_sessions"
  ON public.quiz_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.store_roles sr
      WHERE sr.user_id = auth.uid()
        AND sr.role = 'consulente_responsabile'
        AND sr.store_id = quiz_sessions.store_id
    )
  );

-- ── 5. manager_audit_log — same pattern ──────────────────────────────────────
DO $$
BEGIN
  DROP POLICY IF EXISTS "staff_read_audit_log"     ON public.manager_audit_log;
  DROP POLICY IF EXISTS "manager_read_audit_log"   ON public.manager_audit_log;
  DROP POLICY IF EXISTS "consulente_read_audit_log" ON public.manager_audit_log;
END $$;

CREATE POLICY "manager_read_audit_log"
  ON public.manager_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.store_roles sr
      WHERE sr.user_id = auth.uid()
        AND sr.role = 'manager'
    )
  );

CREATE POLICY "consulente_read_audit_log"
  ON public.manager_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.store_roles sr
      WHERE sr.user_id = auth.uid()
        AND sr.role = 'consulente_responsabile'
        AND sr.store_id = manager_audit_log.store_id
    )
  );
