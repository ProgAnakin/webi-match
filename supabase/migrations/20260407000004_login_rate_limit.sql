-- ─────────────────────────────────────────────────────────────────────────────
-- Server-side login rate limiting for Analytics dashboard
-- Tracks failed password attempts per email; locks out after 5 failures.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.login_attempts (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT        NOT NULL,
  success    BOOLEAN     NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "no_client_access" ON public.login_attempts AS RESTRICTIVE USING (false);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email_created
  ON public.login_attempts (email, created_at DESC);

-- RPC: check_login_rate_limit(email)
-- Returns { locked: bool, locked_seconds: int }
-- Must be called BEFORE attempting signInWithPassword.
CREATE OR REPLACE FUNCTION public.check_login_rate_limit(p_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_failures int;
  lockout_window  interval := interval '5 minutes';
  max_attempts    int      := 5;
  locked_secs     int;
BEGIN
  SELECT count(*) INTO recent_failures
  FROM login_attempts
  WHERE email = p_email
    AND success = false
    AND created_at > (now() - lockout_window);

  IF recent_failures >= max_attempts THEN
    SELECT EXTRACT(EPOCH FROM (
      (SELECT created_at FROM login_attempts
       WHERE email = p_email AND success = false
       ORDER BY created_at DESC
       OFFSET (max_attempts - 1) LIMIT 1)
      + lockout_window - now()
    ))::int INTO locked_secs;
    RETURN jsonb_build_object('locked', true, 'locked_seconds', GREATEST(locked_secs, 0));
  END IF;

  RETURN jsonb_build_object('locked', false, 'locked_seconds', 0);
END;
$$;

-- RPC: record_login_attempt(email, success)
CREATE OR REPLACE FUNCTION public.record_login_attempt(p_email text, p_success boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO login_attempts (email, success) VALUES (p_email, p_success);
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_login_rate_limit(text)    TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_login_attempt(text, bool) TO anon, authenticated;
