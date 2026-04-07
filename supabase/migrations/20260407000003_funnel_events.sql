-- ─────────────────────────────────────────────────────────────────────────────
-- Quiz funnel events + email tracking columns
-- Tracks quiz_started / result_shown / claimed to measure abandonment.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.quiz_funnel_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_key  TEXT        NOT NULL,  -- client-generated UUID, links events of same session
  event_type  TEXT        NOT NULL,  -- 'quiz_started' | 'result_shown' | 'claimed'
  store_id    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Public insert allowed (anonymous users trigger these events during quiz)
ALTER TABLE public.quiz_funnel_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_insert" ON public.quiz_funnel_events FOR INSERT WITH CHECK (true);
-- Only authenticated (admin) users can read the funnel data
CREATE POLICY "allow_select_auth" ON public.quiz_funnel_events FOR SELECT USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_funnel_event_type ON public.quiz_funnel_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_funnel_key ON public.quiz_funnel_events (funnel_key);

-- Email tracking columns on quiz_sessions (prepared for future email service integration)
ALTER TABLE public.quiz_sessions
  ADD COLUMN IF NOT EXISTS email_opened_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_clicked_at    TIMESTAMPTZ;
