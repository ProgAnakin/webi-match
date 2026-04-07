-- ─────────────────────────────────────────────────────────────────────────────
-- Admin access log + server-side lockout
-- Tracks all PIN attempts per device; lockout computed server-side.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.admin_access_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  TEXT NOT NULL,          -- localStorage device identifier
  success    BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only service role can read directly; RPC uses SECURITY DEFINER
ALTER TABLE public.admin_access_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "no_client_access" ON public.admin_access_log AS RESTRICTIVE
  USING (false);

CREATE INDEX IF NOT EXISTS idx_admin_access_log_client_created
  ON public.admin_access_log (client_id, created_at DESC);

-- Updated verify_staff_pin: logs every attempt + enforces server-side lockout.
-- Returns JSON: { valid: bool, locked_seconds: int }
CREATE OR REPLACE FUNCTION public.verify_staff_pin(
  pin_input  text,
  client_id  text DEFAULT 'default'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = extensions, public
AS $$
DECLARE
  stored_hash      text;
  recent_failures  int;
  lockout_window   interval := interval '2 minutes';
  max_attempts     int      := 3;
  locked_until     timestamptz;
  locked_secs      int;
  pin_valid        boolean;
BEGIN
  -- Count recent failures for this device
  SELECT count(*) INTO recent_failures
  FROM public.admin_access_log
  WHERE admin_access_log.client_id = verify_staff_pin.client_id
    AND success = false
    AND created_at > (now() - lockout_window);

  IF recent_failures >= max_attempts THEN
    -- Return how many seconds remain in the lockout
    SELECT EXTRACT(EPOCH FROM (
      (SELECT created_at FROM public.admin_access_log
       WHERE admin_access_log.client_id = verify_staff_pin.client_id
         AND success = false
       ORDER BY created_at DESC
       OFFSET (max_attempts - 1) LIMIT 1)
      + lockout_window - now()
    ))::int INTO locked_secs;

    RETURN jsonb_build_object('valid', false, 'locked_seconds', GREATEST(locked_secs, 0));
  END IF;

  -- Verify PIN
  SELECT value INTO stored_hash FROM public.app_config WHERE key = 'staff_pin_hash';
  pin_valid := stored_hash IS NOT NULL AND stored_hash = crypt(pin_input, stored_hash);

  -- Log this attempt
  INSERT INTO public.admin_access_log (client_id, success)
  VALUES (verify_staff_pin.client_id, pin_valid);

  RETURN jsonb_build_object('valid', pin_valid, 'locked_seconds', 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_staff_pin(text, text) TO anon, authenticated;
