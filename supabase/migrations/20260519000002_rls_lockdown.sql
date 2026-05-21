-- Security lockdown — closes the RLS holes found in the 2026-05-21 audit.
--
-- Root cause: several early migrations created broad "USING (true)" policies.
-- Later migrations added correct role-scoped policies but did NOT drop the
-- broad ones. Postgres OR's all policies together, so each stale "USING (true)"
-- silently kept full access open.
--
-- This was tolerable while every authenticated user was a trusted dashboard
-- operator. The new junior `consulente` role (migration 20260519000001) gives
-- logins to staff who must NOT be able to read customer PII or edit the
-- catalog — so "any authenticated user" is no longer a trusted set.
--
-- Each fix below removes the catch-all and relies on the role-scoped policies
-- already present (or adds a manager-only one).

-- ── 1. quiz_sessions — drop the catch-all SELECT (customer PII) ──────────────
-- "Authenticated users can read quiz sessions" USING (auth.uid() IS NOT NULL)
-- (migration 20260404000001) let ANY logged-in user read every customer's
-- email / nome / cognome / discount_code / answers. The role-aware
-- manager_read_sessions + consulente_read_sessions policies from
-- 20260429000002 remain and are sufficient.
DROP POLICY IF EXISTS "Authenticated users can read quiz sessions" ON public.quiz_sessions;

-- ── 2. product_settings — drop the catch-all write policy ───────────────────
-- product_settings_write_authenticated (20260405000004) FOR ALL USING (true)
-- let any authenticated user rewrite any store's pricing/discounts.
-- manager_all_stores + consulente_own_store (20260429000002) remain.
DROP POLICY IF EXISTS "product_settings_write_authenticated" ON public.product_settings;

-- ── 3. custom_products — manager-only writes ────────────────────────────────
DROP POLICY IF EXISTS "auth manage custom products" ON public.custom_products;
DROP POLICY IF EXISTS "manager manage custom products" ON public.custom_products;
CREATE POLICY "manager manage custom products"
  ON public.custom_products FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.store_roles sr
            WHERE sr.user_id = auth.uid() AND sr.role = 'manager')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.store_roles sr
            WHERE sr.user_id = auth.uid() AND sr.role = 'manager')
  );

-- ── 4. product_global_status — manager-only writes ──────────────────────────
DROP POLICY IF EXISTS "auth manage global status" ON public.product_global_status;
DROP POLICY IF EXISTS "manager manage global status" ON public.product_global_status;
CREATE POLICY "manager manage global status"
  ON public.product_global_status FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.store_roles sr
            WHERE sr.user_id = auth.uid() AND sr.role = 'manager')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.store_roles sr
            WHERE sr.user_id = auth.uid() AND sr.role = 'manager')
  );

-- ── 5. quiz_cards — re-assert manager-only writes (idempotent safety net) ────
-- 20260518000003 already does this; repeated here so the lockdown holds even
-- if that migration was not applied.
DROP POLICY IF EXISTS "auth manage quiz_cards" ON public.quiz_cards;
DROP POLICY IF EXISTS "manager manage quiz_cards" ON public.quiz_cards;
CREATE POLICY "manager manage quiz_cards"
  ON public.quiz_cards FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.store_roles sr
            WHERE sr.user_id = auth.uid() AND sr.role = 'manager')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.store_roles sr
            WHERE sr.user_id = auth.uid() AND sr.role = 'manager')
  );

-- ── 6. email_template — manager-only UPDATE ─────────────────────────────────
-- manager_update_email_template (20260514000003) was TO authenticated
-- USING (true) despite its name — any logged-in user could rewrite the
-- customer email content (incl. the raw-HTML header fields).
DROP POLICY IF EXISTS "manager_update_email_template" ON public.email_template;
CREATE POLICY "manager_update_email_template"
  ON public.email_template FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.store_roles sr
            WHERE sr.user_id = auth.uid() AND sr.role = 'manager')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.store_roles sr
            WHERE sr.user_id = auth.uid() AND sr.role = 'manager')
  );

-- ── 7. check_email_insert_limit — pin search_path on the SECURITY DEFINER fn ─
CREATE OR REPLACE FUNCTION public.check_email_insert_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (
    SELECT COUNT(*)
    FROM public.quiz_sessions
    WHERE email = NEW.email
      AND created_at > now() - INTERVAL '1 hour'
  ) >= 5 THEN
    RAISE EXCEPTION 'Too many requests for this email. Try again later.';
  END IF;
  RETURN NEW;
END;
$$;

NOTIFY pgrst, 'reload schema';
