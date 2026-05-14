-- RPC callable by anon (manager dashboard) to purge sessions older than N days.
-- Returns the count of deleted rows so the UI can show feedback.
-- Minimum 1 day, maximum 365 days — prevents accidental full wipes.
-- Related funnel events are automatically deleted via ON DELETE CASCADE.

CREATE OR REPLACE FUNCTION purge_sessions_older_than(p_days INTEGER DEFAULT 7)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  p_days := GREATEST(1, LEAST(365, p_days));

  WITH deleted AS (
    DELETE FROM quiz_sessions
    WHERE created_at < NOW() - (p_days || ' days')::INTERVAL
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  RETURN deleted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION purge_sessions_older_than(INTEGER) TO anon;
