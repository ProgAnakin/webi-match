-- ──────────────────────────────────────────────────────────────────────────────
-- SECURITY FINAL HARDENING
-- Execute this in the Supabase SQL editor.
-- ──────────────────────────────────────────────────────────────────────────────

-- 1. Block UPDATE and DELETE on quiz_sessions for everyone, including authenticated users.
--    Quiz sessions are append-only records — once inserted they must never be altered.
--    Only the Supabase service-role (used internally by Supabase itself) can bypass this.

DROP POLICY IF EXISTS "Authenticated users can update quiz sessions" ON public.quiz_sessions;
DROP POLICY IF EXISTS "Authenticated users can delete quiz sessions" ON public.quiz_sessions;

-- Explicit DENY policies (no policy = implicit deny, but explicit is safer)
-- These ensure no future migration accidentally opens UPDATE/DELETE.
CREATE POLICY "quiz_sessions_no_update"
  ON public.quiz_sessions
  FOR UPDATE
  USING (false);

CREATE POLICY "quiz_sessions_no_delete"
  ON public.quiz_sessions
  FOR DELETE
  USING (false);

-- 2. Fix the audit log RLS — the comment said "own entries" but USING(true) returned all rows.
--    Correct it so each manager only reads their own audit trail,
--    while still allowing the full audit to admins (service role bypasses RLS anyway).

DROP POLICY IF EXISTS "audit_log_select_authenticated" ON public.manager_audit_log;

CREATE POLICY "audit_log_select_own"
  ON public.manager_audit_log
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 3. Block UPDATE and DELETE on manager_audit_log — audit entries are immutable by design.

CREATE POLICY "audit_log_no_update"
  ON public.manager_audit_log
  FOR UPDATE
  USING (false);

CREATE POLICY "audit_log_no_delete"
  ON public.manager_audit_log
  FOR DELETE
  USING (false);

-- 4. Block DELETE on product_settings — products should only be toggled (active=true/false),
--    never deleted. Prevents accidental data loss.

DROP POLICY IF EXISTS "product_settings_delete" ON public.product_settings;

CREATE POLICY "product_settings_no_delete"
  ON public.product_settings
  FOR DELETE
  USING (false);

-- 5. Tighten the INSERT on quiz_sessions:
--    Validate that match_percent is in [0,100] and matched_product_id is not empty.
--    (These are also enforced by table constraints, this is an extra defence layer.)

DROP POLICY IF EXISTS "Anyone can insert quiz sessions" ON public.quiz_sessions;

CREATE POLICY "quiz_sessions_insert_public"
  ON public.quiz_sessions
  FOR INSERT
  WITH CHECK (
    email IS NOT NULL
    AND length(trim(email)) > 0
    AND match_percent BETWEEN 0 AND 100
    AND length(trim(matched_product_id)) > 0
  );
