-- ─────────────────────────────────────────────────────────────────────────────
-- Remove the non-functional PII-encryption scaffolding.
--
-- Background (2026-05-30 audit):
--   Migration 20260429000003 added nome_enc / cognome_enc (AES) and email_hash
--   (SHA-256) columns plus the encrypt_session_pii() function, intending to
--   store customer PII encrypted at rest. That cut-over was never completed:
--
--     • The application (manager dashboard, stats, CSV export, search) reads the
--       PLAINTEXT  nome / cognome / email  columns everywhere — the *_enc /
--       *_hash columns are written but NEVER read by any code path.
--     • So PII was being stored TWICE (plaintext + encrypted) and only the
--       plaintext copy was ever used. The encrypted columns added storage and
--       an extra copy of personal data to any DB leak without protecting
--       anything — and email_hash (unsalted SHA-256) is itself reversible.
--
-- Decision: rather than break the dashboard's partial-match search on
-- email/name (impossible over ciphertext), protect this operationally-required
-- PII through ACCESS CONTROL instead — which is already enforced:
--
--     • quiz_sessions has NO anon SELECT policy; only authenticated managers
--       (all stores) and consulenti (own store) can read it — see
--       20260429000002_store_roles_rls.sql.
--     • Supabase encrypts all data at rest at the storage layer.
--     • Old sessions are purged on a retention schedule (purge_sessions_*).
--
-- This migration removes the dead, misleading scaffolding so the schema tells
-- the truth and stops duplicating personal data.
--
-- ORDER OF OPERATIONS (important): deploy the updated on-session-created Edge
-- Function FIRST (it no longer calls encrypt_session_pii), THEN apply this
-- migration. Doing it in this order means nothing ever calls a dropped function.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Drop the function that wrote the encrypted/hashed columns. Idempotent.
DROP FUNCTION IF EXISTS public.encrypt_session_pii(uuid, text, text, text, text);

-- 2. Drop the dead columns. They only ever held a duplicate (encrypted) or a
--    reversible (hashed) copy of data that lives, and is used, in plaintext
--    columns on the same row — so no information is lost. Idempotent.
ALTER TABLE public.quiz_sessions
  DROP COLUMN IF EXISTS nome_enc,
  DROP COLUMN IF EXISTS cognome_enc,
  DROP COLUMN IF EXISTS email_hash;

-- 3. Reload PostgREST's schema cache so the dropped columns disappear from the API.
NOTIFY pgrst, 'reload schema';
