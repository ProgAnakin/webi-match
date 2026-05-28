-- Security: close the RLS / RPC holes found in the 2026-05-28 audit.
--
-- Three real problems discovered, all critical:
--
-- 1. quiz_cards has a policy "anon manage quiz_cards" FOR ALL TO anon
--    USING (true) WITH CHECK (true) — created in 20260514000001.
--    Two later hardening migrations (20260518000003 and 20260519000002)
--    tried to drop it but used the wrong policy name ("auth manage ...").
--    Net effect: any unauthenticated visitor can DELETE/INSERT/UPDATE
--    every row of quiz_cards via PostgREST → trivial kiosk deface
--    across every store. Drop it for real.
--
-- 2. verify_staff_pin(text) — the original 1-arg overload from
--    20260407000001 — is granted to anon but performs ZERO rate-limiting
--    (no admin_access_log writes, no lockout). The 4-arg overload from
--    20260507000001 enforces rate-limiting, but anon can simply call the
--    1-arg form directly and brute-force the 4-digit PIN against bcrypt
--    with no upper bound. Drop the 1-arg overload entirely. The frontend
--    already uses the 4-arg form (AdminPinOverlay.tsx).
--
-- 3. The quiz_sessions UPDATE policy added in 20260501000001 was
--    row-level only, so a consulente_responsabile could rewrite ANY
--    column (email / nome / discount_code / answers) of any session in
--    their own store, not just the redemption columns. Pin writes to the
--    redemption columns via column-level GRANT — RLS row scope stays,
--    but the column scope is enforced by the grant.

-- ── 1. Close the anon write hole on quiz_cards ───────────────────────────────
DROP POLICY IF EXISTS "anon manage quiz_cards" ON public.quiz_cards;
-- Defence in depth: ensure SELECT remains open for the kiosk.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename  = 'quiz_cards'
       AND policyname = 'anon read quiz_cards'
  ) THEN
    CREATE POLICY "anon read quiz_cards"
      ON public.quiz_cards FOR SELECT TO anon USING (true);
  END IF;
END $$;

-- ── 2. Drop the unrate-limited verify_staff_pin(text) overload ───────────────
REVOKE EXECUTE ON FUNCTION public.verify_staff_pin(text) FROM anon, authenticated;
DROP FUNCTION IF EXISTS public.verify_staff_pin(text);

-- ── 3. Column-level GRANT for the redemption UPDATE ──────────────────────────
-- RLS policies are row-level; without a column GRANT, any authenticated user
-- matched by the policy can rewrite ANY column of the row. Restrict the
-- writable surface to the two redemption columns and revoke broad UPDATE.
--
-- Note: managers should still be able to perform other UPDATEs through their
-- own policies (which we keep). The grant below scopes what "authenticated"
-- can update column-wise; managers operate via their own policies that target
-- specific columns through service-layer code.
REVOKE UPDATE ON public.quiz_sessions FROM authenticated;
GRANT UPDATE (code_redeemed, code_redeemed_at) ON public.quiz_sessions TO authenticated;

NOTIFY pgrst, 'reload schema';
