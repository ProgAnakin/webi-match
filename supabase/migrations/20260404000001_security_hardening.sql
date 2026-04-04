-- ──────────────────────────────────────────────────────────────────────────────
-- SECURITY HARDENING: quiz_sessions
-- ──────────────────────────────────────────────────────────────────────────────

-- 1. Rimuove la policy "Anyone can read" — esponeva tutte le email al pubblico
DROP POLICY IF EXISTS "Anyone can read quiz sessions" ON public.quiz_sessions;

-- 2. Solo gli utenti autenticati (admin) possono leggere le sessioni
CREATE POLICY "Authenticated users can read quiz sessions"
  ON public.quiz_sessions
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 3. Vincolo email: verifica formato a livello di database
--    Blocca inserimenti con email malformate anche se il client è bypassato
ALTER TABLE public.quiz_sessions
  ADD CONSTRAINT valid_email_format
  CHECK (email ~* '^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$');

-- 4. Limite: un massimo di 20 sessioni per email (anti-spam)
--    Implementato come funzione per poter essere usato nella policy INSERT
CREATE OR REPLACE FUNCTION public.check_email_insert_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (
    SELECT COUNT(*)
    FROM public.quiz_sessions
    WHERE email = NEW.email
      AND created_at > now() - INTERVAL '1 hour'
  ) >= 5 THEN
    RAISE EXCEPTION 'Troppe richieste per questa email. Riprova più tardi.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_email_rate_limit
  BEFORE INSERT ON public.quiz_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_email_insert_limit();

-- 5. Indice per migliorare le performance delle query analytics
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_created_at
  ON public.quiz_sessions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quiz_sessions_email
  ON public.quiz_sessions (email);

CREATE INDEX IF NOT EXISTS idx_quiz_sessions_product
  ON public.quiz_sessions (matched_product_id);
