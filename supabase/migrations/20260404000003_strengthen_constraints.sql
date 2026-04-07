-- Strengthen server-side input constraints on quiz_sessions
-- These run inside Postgres and cannot be bypassed by client-side validation

-- 1. Cap nome / cognome length to prevent large payloads
ALTER TABLE public.quiz_sessions
  ADD CONSTRAINT nome_length    CHECK (nome    IS NULL OR (char_length(nome)    BETWEEN 1 AND 100)),
  ADD CONSTRAINT cognome_length CHECK (cognome IS NULL OR (char_length(cognome) BETWEEN 1 AND 100));

-- 2. Harden email constraint (already exists, this replaces it with stricter pattern)
ALTER TABLE public.quiz_sessions
  DROP CONSTRAINT IF EXISTS quiz_sessions_email_check;

ALTER TABLE public.quiz_sessions
  ADD CONSTRAINT quiz_sessions_email_check
    CHECK (email ~* '^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$');

-- 3. Cap match_percent to valid range 0-100
ALTER TABLE public.quiz_sessions
  ADD CONSTRAINT match_percent_range CHECK (match_percent BETWEEN 0 AND 100);

-- 4. Add index on email for faster rate-limit trigger lookups
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_email_created
  ON public.quiz_sessions (email, created_at DESC);
