-- RPC: check_email_cooldown
-- Returns whether an email address has participated in the last 24 hours.
-- Used by WelcomeScreen to prevent duplicate sessions on the same day.
CREATE OR REPLACE FUNCTION public.check_email_cooldown(p_email TEXT)
RETURNS TABLE (in_cooldown BOOLEAN, hours_remaining NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_session TIMESTAMPTZ;
  v_cooldown_hours CONSTANT NUMERIC := 24;
  v_hours_since    NUMERIC;
BEGIN
  SELECT created_at INTO v_last_session
  FROM public.quiz_sessions
  WHERE LOWER(TRIM(email)) = LOWER(TRIM(p_email))
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_last_session IS NULL THEN
    RETURN QUERY SELECT FALSE::BOOLEAN, 0::NUMERIC;
    RETURN;
  END IF;

  v_hours_since := EXTRACT(EPOCH FROM (NOW() - v_last_session)) / 3600.0;

  IF v_hours_since < v_cooldown_hours THEN
    RETURN QUERY SELECT TRUE::BOOLEAN, ROUND(v_cooldown_hours - v_hours_since, 1)::NUMERIC;
  ELSE
    RETURN QUERY SELECT FALSE::BOOLEAN, 0::NUMERIC;
  END IF;
END;
$$;

-- Anon users need EXECUTE so the kiosk can call this without auth
GRANT EXECUTE ON FUNCTION public.check_email_cooldown(TEXT) TO anon, authenticated;
