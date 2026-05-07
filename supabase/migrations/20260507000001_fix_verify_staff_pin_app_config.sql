-- ─────────────────────────────────────────────────────────────────────────────
-- Fix: verify_staff_pin (4-arg) was reading from public.app_settings, which does
-- not exist. The PIN hash table created in 20260407000001 is public.app_config.
-- This migration recreates the function with the correct table name. The body
-- otherwise mirrors the version in 20260429000001_security_hardening_silent.sql.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.verify_staff_pin(
  pin_input  text,
  client_id  text    DEFAULT 'default',
  user_agent text    DEFAULT '',
  ip_address text    DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = extensions, public
AS $$
DECLARE
  stored_hash        text;
  failures_client    int;
  failures_ip        int;
  lockout_window     interval := interval '2 minutes';
  max_attempts       int      := 3;
  locked_secs        int;
  pin_valid          boolean;
BEGIN
  SELECT count(*) INTO failures_client
  FROM public.admin_access_log
  WHERE admin_access_log.client_id = verify_staff_pin.client_id
    AND success = false
    AND created_at > (now() - lockout_window);

  IF ip_address IS NOT NULL THEN
    SELECT count(*) INTO failures_ip
    FROM public.admin_access_log
    WHERE admin_access_log.ip_address = verify_staff_pin.ip_address
      AND success = false
      AND created_at > (now() - lockout_window);
  ELSE
    failures_ip := 0;
  END IF;

  IF failures_client >= max_attempts OR failures_ip >= max_attempts THEN
    SELECT GREATEST(0, EXTRACT(EPOCH FROM (
      MAX(created_at) + lockout_window - now()
    ))::int)
    INTO locked_secs
    FROM public.admin_access_log
    WHERE (
      admin_access_log.client_id = verify_staff_pin.client_id
      OR (ip_address IS NOT NULL AND admin_access_log.ip_address = verify_staff_pin.ip_address)
    )
    AND success = false
    AND created_at > (now() - lockout_window);
    RETURN jsonb_build_object('valid', false, 'locked_seconds', COALESCE(locked_secs, 120));
  END IF;

  -- FIX: read from app_config (the table that actually exists), not app_settings.
  SELECT value INTO stored_hash
  FROM public.app_config
  WHERE key = 'staff_pin_hash';

  IF stored_hash IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'locked_seconds', 0);
  END IF;

  pin_valid := (extensions.crypt(pin_input, stored_hash) = stored_hash);

  INSERT INTO public.admin_access_log (client_id, user_agent, ip_address, success)
  VALUES (
    verify_staff_pin.client_id,
    NULLIF(verify_staff_pin.user_agent, ''),
    verify_staff_pin.ip_address,
    pin_valid
  );

  IF pin_valid THEN
    RETURN jsonb_build_object('valid', true, 'locked_seconds', 0);
  END IF;

  RETURN jsonb_build_object('valid', false, 'locked_seconds', 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_staff_pin(text, text, text, text)
  TO anon, authenticated;
