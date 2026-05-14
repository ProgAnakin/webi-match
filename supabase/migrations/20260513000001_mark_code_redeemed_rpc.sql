-- RPC callable by anon (manager dashboard) to mark a discount code as redeemed.
-- Uses SECURITY DEFINER + SET row_security = off to bypass Supabase RLS.
-- Returns the count of updated rows (0 = session not found or already redeemed).
-- Idempotent: calling it on an already-redeemed session is a safe no-op returning 0.

CREATE OR REPLACE FUNCTION mark_code_redeemed(p_session_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  rows_updated INTEGER;
BEGIN
  UPDATE quiz_sessions
  SET
    code_redeemed    = TRUE,
    code_redeemed_at = NOW()
  WHERE id = p_session_id
    AND code_redeemed = FALSE;

  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated;
END;
$$;

GRANT EXECUTE ON FUNCTION mark_code_redeemed(UUID) TO anon;
