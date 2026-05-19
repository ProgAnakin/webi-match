-- Manager audit log retention policy.
--
-- The table grows ~1 row per manager action. There is no automatic archival
-- yet — pg_cron is on Supabase's paid tier and the project may run on Free,
-- so we ship a manual purge RPC instead and document the recommended cadence.
--
-- Recommended policy (review yearly):
--   • Keep at least 180 days of audit history for traceability.
--   • Purge anything older than 24 months unless required by compliance.
--   • Run quarterly from /manager or via the Supabase SQL Editor.

CREATE OR REPLACE FUNCTION public.purge_audit_log_older_than(p_days INTEGER DEFAULT 730)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role   text;
  deleted_count INTEGER;
BEGIN
  -- Only managers can purge — consulente_responsabile must not be able to
  -- erase their own audit trail.
  SELECT sr.role INTO caller_role
  FROM public.store_roles sr
  WHERE sr.user_id = auth.uid()
  LIMIT 1;

  IF caller_role IS DISTINCT FROM 'manager' THEN
    RAISE EXCEPTION 'forbidden: caller is not a manager'
      USING ERRCODE = '42501';
  END IF;

  -- Hard floor: never delete less than 180 days of history.
  p_days := GREATEST(180, LEAST(3650, p_days));

  WITH deleted AS (
    DELETE FROM public.manager_audit_log
    WHERE created_at < NOW() - (p_days || ' days')::INTERVAL
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  RETURN deleted_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.purge_audit_log_older_than(INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.purge_audit_log_older_than(INTEGER) FROM anon;
GRANT  EXECUTE ON FUNCTION public.purge_audit_log_older_than(INTEGER) TO authenticated;

-- Index supports the time-range delete cheaply.
CREATE INDEX IF NOT EXISTS manager_audit_log_created_at_idx
  ON public.manager_audit_log (created_at DESC);

NOTIFY pgrst, 'reload schema';
