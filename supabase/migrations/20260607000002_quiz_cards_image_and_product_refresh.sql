-- ─── Quiz cards: optional custom image + product-focused copy refresh ────────
--
-- 1. Adds quiz_cards.image_url — an optional custom image shown in place of the
--    emoji on the swipe card (NULL → the kiosk falls back to the emoji).
-- 2. Refreshes the 8 question texts (IT authoritative + EN/PT/ES/FR) so they
--    revolve around the Suaipe gadget catalogue.
--
-- The card → tag mapping (ids 1–8) and the sort order are unchanged, so the
-- matching algorithm and its unit tests are unaffected — only the displayed
-- copy changes. Emojis are kept as the fallback when no image is set.

BEGIN;

ALTER TABLE public.quiz_cards
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Card 1 — sport
UPDATE public.quiz_cards SET
  text_it = 'Lo sport fa parte della tua routine quotidiana?',
  text_en = 'Is sport part of your daily routine?',
  text_pt = 'O esporte faz parte da sua rotina diária?',
  text_es = '¿El deporte es parte de tu rutina diaria?',
  text_fr = 'Le sport fait-il partie de ta routine quotidienne ?',
  updated_at = NOW()
WHERE id = 1;

-- Card 2 — audio
UPDATE public.quiz_cards SET
  text_it = 'La musica ti accompagna ovunque tu vada?',
  text_en = 'Does music follow you everywhere you go?',
  text_pt = 'A música te acompanha aonde quer que você vá?',
  text_es = '¿La música te acompaña a dondequiera que vayas?',
  text_fr = 'La musique t''accompagne partout où tu vas ?',
  updated_at = NOW()
WHERE id = 2;

-- Card 3 — productivity
UPDATE public.quiz_cards SET
  text_it = 'Ami i gadget che ti semplificano e velocizzano la giornata?',
  text_en = 'Do you love gadgets that simplify and speed up your day?',
  text_pt = 'Você ama gadgets que simplificam e agilizam o seu dia?',
  text_es = '¿Te encantan los gadgets que simplifican y agilizan tu día?',
  text_fr = 'Tu adores les gadgets qui simplifient et accélèrent ta journée ?',
  updated_at = NOW()
WHERE id = 3;

-- Card 4 — wellness
UPDATE public.quiz_cards SET
  text_it = 'Ti concedi ogni giorno un momento di benessere e cura di te?',
  text_en = 'Do you give yourself a moment of wellness and self-care every day?',
  text_pt = 'Você se dá um momento de bem-estar e autocuidado todos os dias?',
  text_es = '¿Te regalas cada día un momento de bienestar y autocuidado?',
  text_fr = 'Tu t''offres chaque jour un moment de bien-être et de soin de toi ?',
  updated_at = NOW()
WHERE id = 4;

-- Card 5 — travel
UPDATE public.quiz_cards SET
  text_it = 'Ti piace avere con te i tuoi dispositivi anche in viaggio?',
  text_en = 'Do you like having your devices with you even when traveling?',
  text_pt = 'Você gosta de ter seus dispositivos com você mesmo viajando?',
  text_es = '¿Te gusta llevar tus dispositivos contigo incluso de viaje?',
  text_fr = 'Tu aimes garder tes appareils avec toi même en voyage ?',
  updated_at = NOW()
WHERE id = 5;

-- Card 6 — tech
UPDATE public.quiz_cards SET
  text_it = 'Sei attratto dai dispositivi smart e dall''ultima tecnologia?',
  text_en = 'Are you drawn to smart devices and the latest technology?',
  text_pt = 'Você é atraído por dispositivos inteligentes e a última tecnologia?',
  text_es = '¿Te atraen los dispositivos inteligentes y la última tecnología?',
  text_fr = 'Tu es attiré par les appareils intelligents et les dernières technologies ?',
  updated_at = NOW()
WHERE id = 6;

-- Card 7 — style
UPDATE public.quiz_cards SET
  text_it = 'Per te conta anche il design, oltre alla funzionalità?',
  text_en = 'Does design matter to you, not just how things work?',
  text_pt = 'Para você o design também conta, além da funcionalidade?',
  text_es = '¿Para ti también cuenta el diseño, además de la funcionalidad?',
  text_fr = 'Pour toi le design compte aussi, pas seulement la fonctionnalité ?',
  updated_at = NOW()
WHERE id = 7;

-- Card 8 — recovery
UPDATE public.quiz_cards SET
  text_it = 'Recupero muscolare e sonno di qualità sono importanti per te?',
  text_en = 'Are muscle recovery and quality sleep important to you?',
  text_pt = 'Recuperação muscular e sono de qualidade são importantes para você?',
  text_es = '¿La recuperación muscular y el sueño de calidad son importantes para ti?',
  text_fr = 'La récupération musculaire et un sommeil de qualité sont importants pour toi ?',
  updated_at = NOW()
WHERE id = 8;

NOTIFY pgrst, 'reload schema';

COMMIT;
