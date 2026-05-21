-- Consultant training zone (/consulente).
--
-- A read-only learning area for sales consultants. The manager writes a sales
-- guide for each product by hand from /manager → Gestione → "Consultant Guide".
-- No AI, no external API — 100% inside Supabase.
--
-- Adds:
--   1. a third store_roles role: 'consulente' (junior consultant, /consulente only)
--   2. product_guides table — one row per product, Italian primary + English optional
--   3. RLS — every authenticated staff member reads; only managers write
--   4. updates upsert_store_role_admin so the Roles tab can assign 'consulente'

-- ── 1. Add the 'consulente' role ────────────────────────────────────────────
ALTER TABLE public.store_roles
  DROP CONSTRAINT IF EXISTS store_roles_role_check;

ALTER TABLE public.store_roles
  ADD CONSTRAINT store_roles_role_check
  CHECK (role IN ('manager', 'consulente_responsabile', 'consulente'));

-- ── 2. product_guides table ─────────────────────────────────────────────────
-- product_id is free text: it matches either a core product id (hardcoded in
-- src/data/products.ts) or a custom_products.id. It is intentionally NOT a
-- foreign key — core products do not exist as DB rows. product_name is stored
-- denormalised so /consulente can render the list without resolving two
-- product sources.
CREATE TABLE IF NOT EXISTS public.product_guides (
  product_id      text PRIMARY KEY,
  product_name    text NOT NULL DEFAULT '',
  description_it  text NOT NULL DEFAULT '',
  specs_it        text NOT NULL DEFAULT '',
  tips_it         text NOT NULL DEFAULT '',
  description_en  text NOT NULL DEFAULT '',
  specs_en        text NOT NULL DEFAULT '',
  tips_en         text NOT NULL DEFAULT '',
  updated_at      timestamptz NOT NULL DEFAULT now(),
  updated_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.product_guides ENABLE ROW LEVEL SECURITY;

-- ── 3. RLS ──────────────────────────────────────────────────────────────────
-- Read: any authenticated staff member (consultants need it, managers preview).
DROP POLICY IF EXISTS "staff read product_guides" ON public.product_guides;
CREATE POLICY "staff read product_guides"
  ON public.product_guides
  FOR SELECT
  TO authenticated
  USING (true);

-- Write: managers only. The training content is global, not per-store.
DROP POLICY IF EXISTS "manager write product_guides" ON public.product_guides;
CREATE POLICY "manager write product_guides"
  ON public.product_guides
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

-- ── 4. Allow the Roles tab to assign 'consulente' ───────────────────────────
-- Recreated from 20260518000002 with the role whitelist widened. A plain
-- 'consulente' does not require a store_id (the training zone is global);
-- only 'consulente_responsabile' still does.
CREATE OR REPLACE FUNCTION public.upsert_store_role_admin(
  p_user_email text,
  p_role       text,
  p_store_id   text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  caller_role  text;
  target_uid   uuid;
  inserted_id  uuid;
BEGIN
  SELECT sr.role INTO caller_role
  FROM public.store_roles sr
  WHERE sr.user_id = auth.uid()
  LIMIT 1;

  IF caller_role IS DISTINCT FROM 'manager' THEN
    RAISE EXCEPTION 'forbidden: caller is not a manager'
      USING ERRCODE = '42501';
  END IF;

  IF p_role NOT IN ('manager', 'consulente_responsabile', 'consulente') THEN
    RAISE EXCEPTION 'invalid role: %', p_role USING ERRCODE = '22023';
  END IF;

  IF p_role = 'consulente_responsabile' AND (p_store_id IS NULL OR length(trim(p_store_id)) = 0) THEN
    RAISE EXCEPTION 'consulente_responsabile requires a store_id' USING ERRCODE = '22023';
  END IF;

  SELECT u.id INTO target_uid
  FROM auth.users u
  WHERE lower(u.email) = lower(trim(p_user_email))
  LIMIT 1;

  IF target_uid IS NULL THEN
    RAISE EXCEPTION 'no auth user found for email: %', p_user_email
      USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.store_roles (user_id, role, store_id)
  VALUES (target_uid, p_role, NULLIF(trim(p_store_id), ''))
  ON CONFLICT (user_id) DO UPDATE
    SET role = EXCLUDED.role,
        store_id = EXCLUDED.store_id
  RETURNING id INTO inserted_id;

  RETURN inserted_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.upsert_store_role_admin(text, text, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.upsert_store_role_admin(text, text, text) TO authenticated;

NOTIFY pgrst, 'reload schema';
