-- Fixes three manager-dashboard bugs caused by RLS / schema gaps.
-- The manager dashboard runs as an authenticated Supabase user (see Manager.tsx),
-- but several tables only had policies for the anon (kiosk) role.

-- ── Fix 1: quiz_cards invisible in the manager dashboard ─────────────────────
-- 20260514000001 only created policies for the anon role, so an authenticated
-- manager's SELECT matched no policy and returned zero rows.
CREATE POLICY "auth read quiz_cards"
  ON public.quiz_cards FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth manage quiz_cards"
  ON public.quiz_cards FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Fix 2: Storico (audit log) always empty ─────────────────────────────────
-- 20260405000006 narrowed the SELECT policy to user_id = auth.uid(), but the
-- Storico tab is a shared catalog-wide history (it renders a store column).
-- Restore catalog-wide visibility for authenticated staff.
DROP POLICY IF EXISTS "audit_log_select_own" ON public.manager_audit_log;

CREATE POLICY "audit_log_select_authenticated"
  ON public.manager_audit_log FOR SELECT TO authenticated USING (true);

-- ── Fix 3: quiz card audit inserts silently fail ────────────────────────────
-- new_active is NOT NULL, but quiz card actions (edit/reorder) have no
-- active-state boolean, so their audit inserts violated the constraint.
ALTER TABLE public.manager_audit_log ALTER COLUMN new_active DROP NOT NULL;
