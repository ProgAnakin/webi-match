-- ─────────────────────────────────────────────────────────────────────────────
-- Strengthen PIN lockout with a secondary User-Agent fingerprint.
-- Even if a user clears localStorage (resetting their client_id UUID), their
-- browser/device User-Agent still identifies them and keeps the lockout active.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add user_agent column (nullable — old rows keep NULL)
ALTER TABLE public.admin_access_log
  ADD COLUMN IF NOT EXISTS user_agent TEXT;

CREATE INDEX IF NOT EXISTS idx_admin_access_log_ua_created
  ON public.admin_access_log (user_agent, created_at DESC);

-- 2. Replace verify_staff_pin to check lockout by EITHER client_id OR user_agent
CREATE OR REPLACE FUNCTION public.verify_staff_pin(
  pin_input  text,
  client_id  text    DEFAULT 'default',
  user_agent text    DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = extensions, public
AS $$
DECLARE
  stored_hash          text;
  failures_by_client   int;
  failures_by_ua       int;
  lockout_window       interval := interval '2 minutes';
  max_attempts         int      := 3;
  locked_secs          int;
  pin_valid            boolean;
BEGIN
  -- Count recent failures by client_id
  SELECT count(*) INTO failures_by_client
  FROM public.admin_access_log
  WHERE admin_access_log.client_id = verify_staff_pin.client_id
    AND success = false
    AND created_at > (now() - lockout_window);

  -- Count recent failures by user_agent (only when a non-empty UA is supplied)
  IF user_agent <> '' THEN
    SELECT count(*) INTO failures_by_ua
    FROM public.admin_access_log
    WHERE admin_access_log.user_agent = verify_staff_pin.user_agent
      AND success = false
      AND created_at > (now() - lockout_window);
  ELSE
    failures_by_ua := 0;
  END IF;

  IF failures_by_client >= max_attempts OR failures_by_ua >= max_attempts THEN
    -- Compute remaining seconds from whichever lockout is longer
    SELECT GREATEST(
      COALESCE((
        SELECT EXTRACT(EPOCH FROM (
          (SELECT created_at FROM public.admin_access_log
            WHERE admin_access_log.client_id = verify_staff_pin.client_id
              AND success = false
            ORDER BY created_at DESC
            OFFSET (max_attempts - 1) LIMIT 1)
          + lockout_window - now()
        ))::int
      ), 0),
      COALESCE((
        SELECT EXTRACT(EPOCH FROM (
          (SELECT created_at FROM public.admin_access_log
            WHERE admin_access_log.user_agent = verify_staff_pin.user_agent
              AND success = false
            ORDER BY created_at DESC
            OFFSET (max_attempts - 1) LIMIT 1)
          + lockout_window - now()
        ))::int
      ), 0)
    ) INTO locked_secs;

    RETURN jsonb_build_object('valid', false, 'locked_seconds', GREATEST(locked_secs, 0));
  END IF;

  -- Verify PIN against stored bcrypt hash
  SELECT value INTO stored_hash FROM public.app_config WHERE key = 'staff_pin_hash';
  pin_valid := stored_hash IS NOT NULL AND stored_hash = crypt(pin_input, stored_hash);

  -- Log this attempt (store both fingerprints)
  INSERT INTO public.admin_access_log (client_id, user_agent, success)
  VALUES (
    verify_staff_pin.client_id,
    NULLIF(verify_staff_pin.user_agent, ''),
    pin_valid
  );

  RETURN jsonb_build_object('valid', pin_valid, 'locked_seconds', 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_staff_pin(text, text, text) TO anon, authenticated;
