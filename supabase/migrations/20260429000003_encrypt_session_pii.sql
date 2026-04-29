-- ─────────────────────────────────────────────────────────────────────────────
-- C2 — PII encryption at rest
--
-- Prerequisites (already applied):
--   • pgcrypto extension enabled (CREATE EXTENSION IF NOT EXISTS pgcrypto)
--   • quiz_sessions has columns: nome_enc bytea, cognome_enc bytea, email_hash text
--
-- Called exclusively by the on-session-created Edge Function (service_role key).
-- The encryption key (PII_ENCRYPTION_KEY) never touches the client — it lives
-- only in Supabase Edge Function Secrets.
-- ─────────────────────────────────────────────────────────────────────────────

-- Ensure pgcrypto is available (idempotent)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ensure columns exist (idempotent — harmless if already added)
ALTER TABLE public.quiz_sessions
  ADD COLUMN IF NOT EXISTS nome_enc    bytea DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cognome_enc bytea DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email_hash  text  DEFAULT NULL;

-- ── encrypt_session_pii ────────────────────────────────────────────────────────
-- Encrypts nome/cognome with AES-256 (OpenPGP symmetric) and stores a SHA-256
-- hash of the normalised email for future duplicate-detection lookups.
CREATE OR REPLACE FUNCTION public.encrypt_session_pii(
  p_session_id uuid,
  p_nome       text,
  p_cognome    text,
  p_email      text,
  p_key        text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = extensions, public
AS $$
BEGIN
  UPDATE public.quiz_sessions
  SET
    nome_enc    = CASE WHEN trim(p_nome)    <> '' THEN pgp_sym_encrypt(p_nome,    p_key) ELSE NULL END,
    cognome_enc = CASE WHEN trim(p_cognome) <> '' THEN pgp_sym_encrypt(p_cognome, p_key) ELSE NULL END,
    email_hash  = encode(digest(lower(trim(p_email)), 'sha256'), 'hex')
  WHERE id = p_session_id;
END;
$$;

-- Strip execute from all non-privileged roles — only service_role (Edge Function) may call this.
REVOKE EXECUTE ON FUNCTION public.encrypt_session_pii(uuid, text, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.encrypt_session_pii(uuid, text, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.encrypt_session_pii(uuid, text, text, text, text) FROM authenticated;
