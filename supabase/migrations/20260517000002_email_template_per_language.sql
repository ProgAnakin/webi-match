-- Refactor email_template from singleton (CHECK id=1) to one row per supported language.
-- The /manager UI gains a language selector; the on-session-created Edge Function picks
-- the row matching quiz_sessions.language at send time. The hardcoded EN/FR/ES/PT
-- fallbacks in the Edge Function are replaced by these seeded rows so the merchant
-- can edit every language without redeploying.

-- 1. Add the language column (nullable for now so we can backfill)
ALTER TABLE public.email_template
  ADD COLUMN IF NOT EXISTS language TEXT;

-- 2. Backfill the existing singleton row as Italian
UPDATE public.email_template SET language = 'it' WHERE language IS NULL;

-- 3. Drop the old primary key on id
ALTER TABLE public.email_template
  DROP CONSTRAINT IF EXISTS email_template_pkey;

-- 4. Find and drop the auto-named CHECK (id = 1) constraint
DO $$
DECLARE
  cname TEXT;
BEGIN
  SELECT conname INTO cname
  FROM pg_constraint
  WHERE conrelid = 'public.email_template'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%id = 1%';
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.email_template DROP CONSTRAINT %I', cname);
  END IF;
END $$;

-- 5. Drop the now-useless id column
ALTER TABLE public.email_template DROP COLUMN IF EXISTS id;

-- 6. Promote language to the new primary key
ALTER TABLE public.email_template
  ALTER COLUMN language SET NOT NULL;

ALTER TABLE public.email_template
  ADD CONSTRAINT email_template_pkey PRIMARY KEY (language);

-- 7. Restrict to the 5 supported languages
ALTER TABLE public.email_template
  DROP CONSTRAINT IF EXISTS email_template_language_check;

ALTER TABLE public.email_template
  ADD CONSTRAINT email_template_language_check
  CHECK (language IN ('it','en','fr','es','pt'));

-- 8. Seed the IT row (ON CONFLICT no-op if backfill above already ran)
INSERT INTO public.email_template (language, sender_name, subject_template, header_title, header_subtitle, footer_store_name)
VALUES
  ('it', 'Costanzo Annichini',
   '{{nome}}, il tuo match è {{pct}}% — Codice sconto valido 24h ⏰',
   'Abbiamo trovato il tuo match!',
   'Il nostro algoritmo ha analizzato le tue risposte e ha selezionato il <strong style="color:#f0f4ff;">gadget perfetto per il tuo stile di vita</strong>.',
   'COSTANZO ANNICHINI')
ON CONFLICT (language) DO NOTHING;

-- 9. Seed the 4 non-Italian rows
INSERT INTO public.email_template (language, sender_name, subject_template, header_title, header_subtitle, footer_store_name)
VALUES
  ('en', 'Costanzo Annichini',
   '{{nome}}, your match is {{pct}}% — Discount code valid 24h ⏰',
   'We found your match!',
   'Our algorithm analysed your answers and selected the <strong style="color:#f0f4ff;">perfect gadget for your lifestyle</strong>.',
   'COSTANZO ANNICHINI'),
  ('fr', 'Costanzo Annichini',
   '{{nome}}, votre match est de {{pct}}% — Code de réduction valable 24h ⏰',
   'Nous avons trouvé votre match !',
   'Notre algorithme a analysé vos réponses et a sélectionné le <strong style="color:#f0f4ff;">gadget parfait pour votre style de vie</strong>.',
   'COSTANZO ANNICHINI'),
  ('es', 'Costanzo Annichini',
   '{{nome}}, tu match es {{pct}}% — Código de descuento válido 24h ⏰',
   '¡Encontramos tu match!',
   'Nuestro algoritmo analizó tus respuestas y seleccionó el <strong style="color:#f0f4ff;">gadget perfecto para tu estilo de vida</strong>.',
   'COSTANZO ANNICHINI'),
  ('pt', 'Costanzo Annichini',
   '{{nome}}, o seu match é {{pct}}% — Código de desconto válido 24h ⏰',
   'Encontrámos o seu match!',
   'O nosso algoritmo analisou as suas respostas e selecionou o <strong style="color:#f0f4ff;">gadget perfeito para o seu estilo de vida</strong>.',
   'COSTANZO ANNICHINI')
ON CONFLICT (language) DO NOTHING;

-- 10. Reload PostgREST schema cache so the API sees the new shape immediately
NOTIFY pgrst, 'reload schema';
