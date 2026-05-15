-- S1: Restrict mark_code_redeemed to authenticated users only.
-- Previously granted to anon, allowing any unauthenticated caller to mark codes as redeemed.
-- Now restricted to authenticated (manager dashboard users) with optional store validation.

-- 1. Revoke from anon
REVOKE EXECUTE ON FUNCTION mark_code_redeemed(UUID) FROM anon;

-- 2. Grant to authenticated only
GRANT EXECUTE ON FUNCTION mark_code_redeemed(UUID) TO authenticated;

-- 3. Replace function body to add caller-store validation.
--    A manager (role = 'manager') can redeem any session.
--    A consulente_responsabile can only redeem sessions belonging to their store.
--    Unauthenticated callers are blocked by the GRANT above (will get permission denied).
CREATE OR REPLACE FUNCTION mark_code_redeemed(p_session_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  rows_updated INTEGER;
  v_caller_role TEXT;
  v_caller_store TEXT;
  v_session_store TEXT;
BEGIN
  -- Resolve the caller's role and store assignment.
  SELECT sr.role, sr.store_id
    INTO v_caller_role, v_caller_store
    FROM public.store_roles sr
   WHERE sr.user_id = auth.uid()
   LIMIT 1;

  -- If caller has no role row they are not a registered manager/consultant.
  IF v_caller_role IS NULL THEN
    RAISE EXCEPTION 'permission denied: no store role found for user';
  END IF;

  -- Consulente: validate that the session belongs to their store.
  IF v_caller_role = 'consulente_responsabile' THEN
    SELECT store_id INTO v_session_store
      FROM public.quiz_sessions
     WHERE id = p_session_id;

    IF v_session_store IS DISTINCT FROM v_caller_store THEN
      RAISE EXCEPTION 'permission denied: session does not belong to your store';
    END IF;
  END IF;

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
