-- Performance: partial index to speed up the Edge Function rate-limit check.
--
-- The on-session-created Edge Function runs this query on every new session:
--
--   SELECT count(*) FROM quiz_sessions
--   WHERE email = $1
--     AND email_sent = true
--     AND created_at >= (now() - interval '1 hour');
--
-- The existing idx_quiz_sessions_email_created covers email + created_at but
-- forces a heap fetch + filter on email_sent. A partial index keyed on the
-- send-success rows lets the planner satisfy the query from the index alone.
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_email_sent_recent
  ON public.quiz_sessions (email, created_at DESC)
  WHERE email_sent = true;

-- Useful for /manager session-status filters that count NULL discount codes.
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_no_code
  ON public.quiz_sessions (created_at DESC)
  WHERE discount_code IS NULL;

NOTIFY pgrst, 'reload schema';
