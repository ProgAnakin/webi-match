-- ─────────────────────────────────────────────────────────────────────────────
-- Hardening for quiz_funnel_events: prevent abuse / counter inflation.
--
-- Original policy was `WITH CHECK (true)` which lets anonymous callers insert
-- arbitrary funnel events to skew dashboard metrics. We tighten this with:
--   1. event_type whitelist via CHECK constraint
--   2. funnel_key UUID-format validation via CHECK constraint
--   3. uniqueness on (funnel_key, event_type) so the same event can't be fired
--      multiple times per session
-- These are belt-and-suspenders alongside any application-level safeguards.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Restrict event_type to known values.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quiz_funnel_events_event_type_check'
  ) THEN
    ALTER TABLE public.quiz_funnel_events
      ADD CONSTRAINT quiz_funnel_events_event_type_check
      CHECK (event_type IN ('quiz_started', 'result_shown', 'claimed'));
  END IF;
END $$;

-- 2. Require funnel_key to look like a UUID (prevents abusive callers from
--    spamming arbitrary keys). Lower bound: any 36-char string with dashes in
--    the right positions. Stricter than nothing.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quiz_funnel_events_funnel_key_check'
  ) THEN
    ALTER TABLE public.quiz_funnel_events
      ADD CONSTRAINT quiz_funnel_events_funnel_key_check
      CHECK (
        funnel_key ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      );
  END IF;
END $$;

-- 3. Per-session uniqueness — each event fires at most once per funnel_key.
--    De-duplicates accidental retries and prevents inflated "Non conversioni"
--    counters from a hostile loop.
CREATE UNIQUE INDEX IF NOT EXISTS uq_funnel_key_event_type
  ON public.quiz_funnel_events (funnel_key, event_type);
