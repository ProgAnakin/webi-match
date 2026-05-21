-- Security hardening migration — addresses items from the 2026-05-18 audit.
--
-- 1. quiz_sessions.discount_code: cannot mark email_sent=true while code is NULL.
--    Prevents sending an email with a blank discount-code area when the pre-send
--    UPDATE silently fails. NULL remains valid pre-send (rows start NULL).
-- 2. quiz_sessions.language: restrict to the five supported languages.
-- 3. store_id format CHECK across the four store-scoped tables.
-- 4. manager_audit_log: drop the catch-all USING(true) SELECT policy so the
--    role-aware policies from 20260429000004 actually enforce store isolation.
-- 5. quiz_cards: keep SELECT open to all authenticated, but restrict
--    INSERT/UPDATE/DELETE to managers (the global quiz config must not be
--    editable by store-scoped consulenti).
-- 6. purge_sessions_older_than: revoke from anon, grant only to authenticated.

-- ── 1. discount_code consistency ────────────────────────────────────────────
ALTER TABLE public.quiz_sessions
  DROP CONSTRAINT IF EXISTS quiz_sessions_discount_code_required_when_sent;

ALTER TABLE public.quiz_sessions
  ADD CONSTRAINT quiz_sessions_discount_code_required_when_sent
  CHECK (NOT email_sent OR discount_code IS NOT NULL);

-- ── 2. language whitelist ───────────────────────────────────────────────────
-- Backfill any unexpected values to NULL so the constraint can be applied.
UPDATE public.quiz_sessions
  SET language = NULL
  WHERE language IS NOT NULL
    AND language NOT IN ('it','en','fr','es','pt');

ALTER TABLE public.quiz_sessions
  DROP CONSTRAINT IF EXISTS quiz_sessions_language_check;

ALTER TABLE public.quiz_sessions
  ADD CONSTRAINT quiz_sessions_language_check
  CHECK (language IS NULL OR language IN ('it','en','fr','es','pt'));

-- ── 3. store_id format CHECKs ───────────────────────────────────────────────
-- Slug shape mirrors src/lib/validators.ts isValidStoreId: lowercase + digits
-- + hyphens, 2–50 chars, leading alphanumeric. Allows future stores without
-- a migration as long as their slug fits the pattern.
ALTER TABLE public.quiz_sessions
  DROP CONSTRAINT IF EXISTS quiz_sessions_store_id_check;
ALTER TABLE public.quiz_sessions
  ADD CONSTRAINT quiz_sessions_store_id_check
  CHECK (store_id IS NULL OR store_id ~ '^[a-z0-9][a-z0-9-]{1,49}$');

ALTER TABLE public.product_settings
  DROP CONSTRAINT IF EXISTS product_settings_store_id_check;
ALTER TABLE public.product_settings
  ADD CONSTRAINT product_settings_store_id_check
  CHECK (store_id IS NULL OR store_id ~ '^[a-z0-9][a-z0-9-]{1,49}$');

ALTER TABLE public.manager_audit_log
  DROP CONSTRAINT IF EXISTS manager_audit_log_store_id_check;
ALTER TABLE public.manager_audit_log
  ADD CONSTRAINT manager_audit_log_store_id_check
  CHECK (store_id IS NULL OR store_id ~ '^[a-z0-9][a-z0-9-]{1,49}$');

ALTER TABLE public.quiz_funnel_events
  DROP CONSTRAINT IF EXISTS quiz_funnel_events_store_id_check;
ALTER TABLE public.quiz_funnel_events
  ADD CONSTRAINT quiz_funnel_events_store_id_check
  CHECK (store_id IS NULL OR store_id ~ '^[a-z0-9][a-z0-9-]{1,49}$');

-- ── 4. manager_audit_log RLS: remove the catch-all policy ───────────────────
-- 20260514000004 added `audit_log_select_authenticated USING (true)` which OR's
-- with the role-aware policies created in 20260429000004 and effectively grants
-- every authenticated user read access to every store's audit history.
DROP POLICY IF EXISTS "audit_log_select_authenticated" ON public.manager_audit_log;

-- ── 5. quiz_cards: tighten the manage policy to managers only ───────────────
DROP POLICY IF EXISTS "auth manage quiz_cards" ON public.quiz_cards;
DROP POLICY IF EXISTS "manager manage quiz_cards" ON public.quiz_cards;

CREATE POLICY "manager manage quiz_cards"
  ON public.quiz_cards
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

-- ── 6. purge_sessions_older_than: revoke from anon ──────────────────────────
REVOKE EXECUTE ON FUNCTION public.purge_sessions_older_than(INTEGER) FROM anon;
GRANT  EXECUTE ON FUNCTION public.purge_sessions_older_than(INTEGER) TO authenticated;

NOTIFY pgrst, 'reload schema';
