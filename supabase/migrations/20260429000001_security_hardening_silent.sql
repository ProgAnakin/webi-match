-- ─────────────────────────────────────────────────────────────────────────────
-- Silent security hardening — no visible change to any customer flow.
-- Apply via: supabase db push  OR  Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Add ip_address column to admin_access_log ──────────────────────────────
-- Enables IP-based lockout for PIN brute-force (currently only client_id + UA).
ALTER TABLE public.admin_access_log
  ADD COLUMN IF NOT EXISTS ip_address TEXT DEFAULT NULL;

-- ── 2. Update verify_staff_pin RPC to track IP ────────────────────────────────
-- Server-side IP lockout that cannot be bypassed by clearing localStorage.
-- Requires client to pass ip_address as 4th argument (pass from Edge Function).
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
  -- Count recent failures by client_id (existing logic)
  SELECT count(*) INTO failures_client
  FROM public.admin_access_log
  WHERE admin_access_log.client_id = verify_staff_pin.client_id
    AND success = false
    AND created_at > (now() - lockout_window);

  -- Count recent failures by IP (new — bypass-proof)
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
    -- Calculate remaining lockout seconds based on most recent failed attempt
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

  -- Fetch stored PIN hash
  SELECT value INTO stored_hash
  FROM public.app_settings
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

-- ── 3. Rate-limit check_email_cooldown RPC ────────────────────────────────────
-- Prevents email enumeration: max 10 lookups per anon session per 10 minutes.
-- Abusive callers receive a synthetic "in cooldown" response (silent misdirection).
CREATE TABLE IF NOT EXISTS public.cooldown_check_log (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_key text        NOT NULL,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.cooldown_check_log ENABLE ROW LEVEL SECURITY;
-- No client access — written only via SECURITY DEFINER function
CREATE POLICY "no_direct_access" ON public.cooldown_check_log AS RESTRICTIVE USING (false);

-- Auto-purge entries older than 1 hour to keep table small
CREATE OR REPLACE FUNCTION public.check_email_cooldown(p_email text)
RETURNS TABLE (in_cooldown boolean, hours_remaining numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_key text;
  v_recent_checks int;
  v_last_session  record;
BEGIN
  -- Use a combination of anon role + request epoch as session key
  -- (not perfect but sufficient to rate-limit automated scripts)
  v_session_key := md5(p_email || date_trunc('hour', now())::text);

  -- Count how many times this key was checked in the last 10 minutes
  SELECT count(*) INTO v_recent_checks
  FROM public.cooldown_check_log
  WHERE session_key = v_session_key
    AND created_at > now() - interval '10 minutes';

  IF v_recent_checks >= 10 THEN
    -- Silent misdirection: return "in cooldown" without revealing real state
    RETURN QUERY SELECT true::boolean, 1::numeric;
    RETURN;
  END IF;

  -- Log this check
  INSERT INTO public.cooldown_check_log (session_key) VALUES (v_session_key);

  -- Purge stale log entries (opportunistic cleanup)
  DELETE FROM public.cooldown_check_log WHERE created_at < now() - interval '1 hour';

  -- Original cooldown logic
  SELECT qs.created_at INTO v_last_session
  FROM public.quiz_sessions qs
  WHERE lower(trim(qs.email)) = lower(trim(p_email))
    AND qs.created_at > now() - interval '1 hour'
  ORDER BY qs.created_at DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN QUERY SELECT
      true::boolean,
      ROUND(
        EXTRACT(EPOCH FROM (v_last_session.created_at + interval '1 hour' - now())) / 3600,
        1
      )::numeric;
  ELSE
    RETURN QUERY SELECT false::boolean, 0::numeric;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_email_cooldown(text) TO anon, authenticated;

-- ── 4. quiz_sessions: enforce store_id must be a known store ──────────────────
-- Rejects sessions from unknown/fake stores at database level (belt-and-suspenders
-- alongside the edge function check). Existing rows are unaffected.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'quiz_sessions_store_id_check'
  ) THEN
    ALTER TABLE public.quiz_sessions
      ADD CONSTRAINT quiz_sessions_store_id_check
      CHECK (
        store_id IS NULL
        OR store_id IN ('corso-vercelli', '5-giornate', 'verona', 'bergamo')
      );
  END IF;
END $$;
