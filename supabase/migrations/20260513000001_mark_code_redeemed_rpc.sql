-- RPC callable by anon (manager PIN sessions) to mark a discount code as redeemed.
-- Uses SECURITY DEFINER to bypass the authenticated-only RLS policy on quiz_sessions.
-- Only updates the two redemption columns — no other data is modified.
-- Idempotent: calling it on an already-redeemed session is a safe no-op.

CREATE OR REPLACE FUNCTION mark_code_redeemed(p_session_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE quiz_sessions
  SET
    code_redeemed    = TRUE,
    code_redeemed_at = NOW()
  WHERE id = p_session_id
    AND code_redeemed = FALSE;
END;
$$;

GRANT EXECUTE ON FUNCTION mark_code_redeemed(UUID) TO anon;
