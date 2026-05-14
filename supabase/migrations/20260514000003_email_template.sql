-- Email template singleton table — stores editable fields used by the
-- on-session-created Edge Function when building the match email.
-- A CHECK (id = 1) constraint guarantees at most one row.

CREATE TABLE IF NOT EXISTS public.email_template (
  id               INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  sender_name      TEXT NOT NULL DEFAULT 'Costanzo Annichini',
  subject_template TEXT NOT NULL DEFAULT '{{nome}}, il tuo match è {{pct}}% — Codice sconto valido 24h ⏰',
  header_title     TEXT NOT NULL DEFAULT 'Abbiamo trovato il tuo match!',
  header_subtitle  TEXT NOT NULL DEFAULT 'Il nostro algoritmo ha analizzato le tue risposte e ha selezionato il gadget perfetto per il tuo stile di vita.',
  footer_store_name TEXT NOT NULL DEFAULT 'COSTANZO ANNICHINI',
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed the default row so the Edge Function always finds exactly one row.
INSERT INTO public.email_template (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.email_template ENABLE ROW LEVEL SECURITY;

-- Anon users (kiosk) have no access; authenticated managers can read and update.
CREATE POLICY "manager_read_email_template"
  ON public.email_template FOR SELECT TO authenticated USING (true);

CREATE POLICY "manager_update_email_template"
  ON public.email_template FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
