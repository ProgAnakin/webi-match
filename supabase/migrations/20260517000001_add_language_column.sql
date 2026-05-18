-- Add language column to quiz_sessions.
-- Written at claim-time so the on-session-created edge function can pick the
-- right Brevo email template (it / en / fr / es / pt). Code in src/pages/Index.tsx
-- has been inserting this field since the i18n rollout, but the column was
-- missing from the schema, causing PostgREST PGRST204 ("Could not find the
-- 'language' column") on every claim.
ALTER TABLE public.quiz_sessions
  ADD COLUMN IF NOT EXISTS language TEXT;

CREATE INDEX IF NOT EXISTS idx_quiz_sessions_language
  ON public.quiz_sessions (language);
