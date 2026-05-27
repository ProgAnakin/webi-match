-- GDPR Art. 7(1) — "the controller shall be able to demonstrate that the
-- data subject has consented to the processing of their personal data".
--
-- Before this migration, the privacy-consent checkbox on the welcome screen
-- only gated the UI flow — there was no persistent proof that the customer
-- had consented. With this column the application records the exact ISO
-- timestamp at which the customer ticked the box, alongside the row that
-- holds their personal data. The pair is sufficient evidence of consent.
--
-- Nullable for backfill safety: rows captured before the rollout simply
-- have NULL here. New rows always carry a timestamp because the front-end
-- writes one and the welcome screen blocks submission without consent.

ALTER TABLE public.quiz_sessions
  ADD COLUMN IF NOT EXISTS consent_given_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS quiz_sessions_consent_given_at_idx
  ON public.quiz_sessions (consent_given_at);

NOTIFY pgrst, 'reload schema';
