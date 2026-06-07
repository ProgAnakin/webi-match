-- ─── Fix: quiz_sessions store_id CHECK rejected the renamed stores ───────────
--
-- The constraint `quiz_sessions_store_id_check` (added in
-- 20260429000001_security_hardening_silent.sql) hardcoded the ORIGINAL store
-- slugs:
--
--     store_id IN ('corso-vercelli', '5-giornate', 'verona', 'bergamo')
--
-- After the 2026-06-06 store rename (rio-de-janeiro / lisboa / dublino /
-- milano), every kiosk claim INSERTed a store_id that was NOT in that list, so
-- the constraint rejected the row. All 3 client retries failed and the result
-- screen surfaced the generic "Errore di connessione — riprova tra qualche
-- secondo." No session was persisted and no email was ever sent.
--
-- Fix: replace the hardcoded allowlist with the SAME slug regex the
-- on-session-created edge function uses to validate store_id
-- (^[a-z0-9][a-z0-9-]{1,49}$). This keeps the "reject malformed/garbage
-- store_id" guard (belt-and-suspenders alongside the edge function) while
-- making future store renames or additions a frontend-only change — this class
-- of silent claim outage can no longer recur on a rename.

BEGIN;

ALTER TABLE public.quiz_sessions
  DROP CONSTRAINT IF EXISTS quiz_sessions_store_id_check;

ALTER TABLE public.quiz_sessions
  ADD CONSTRAINT quiz_sessions_store_id_check
  CHECK (
    store_id IS NULL
    OR store_id ~ '^[a-z0-9][a-z0-9-]{1,49}$'
  );

COMMIT;

NOTIFY pgrst, 'reload schema';
