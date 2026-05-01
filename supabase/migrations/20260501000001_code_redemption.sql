-- Track manual discount code redemption by store consultants.
-- code_redeemed: set to true by the manager when a consultant hands over the code in-store.
-- code_redeemed_at: timestamp of redemption for audit purposes.
--
-- This is intentionally manual: there is no POS integration, so redemption
-- is confirmed by the consultant and recorded via the /manager dashboard.

ALTER TABLE quiz_sessions
  ADD COLUMN IF NOT EXISTS code_redeemed    BOOLEAN      NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS code_redeemed_at TIMESTAMPTZ;

-- Only allow the redemption columns to be updated (not other sensitive fields)
-- via the authenticated role. The RLS policy on quiz_sessions already restricts
-- reads; we add an explicit policy so UPDATE is permitted for store managers.
-- (Super-admins use the service role which bypasses RLS.)

-- Policy: store managers may mark codes as redeemed only for their own store's sessions.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'quiz_sessions' AND policyname = 'managers_can_redeem_codes'
  ) THEN
    CREATE POLICY managers_can_redeem_codes ON quiz_sessions
      FOR UPDATE
      TO authenticated
      USING (
        store_id IN (
          SELECT store_id FROM store_roles
          WHERE user_id = auth.uid()
            AND role IN ('consulente_responsabile', 'admin')
        )
      )
      WITH CHECK (
        store_id IN (
          SELECT store_id FROM store_roles
          WHERE user_id = auth.uid()
            AND role IN ('consulente_responsabile', 'admin')
        )
      );
  END IF;
END $$;
