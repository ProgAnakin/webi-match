-- ════════════════════════════════════════════════════════════════════════════
-- DEMO SEED — populate the /stats dashboard with realistic-looking data
-- ════════════════════════════════════════════════════════════════════════════
-- OPTIONAL. Not a migration — never auto-applied. Run by hand in the Supabase
-- SQL editor to fill the analytics (funnel, leaderboard, match histogram,
-- hourly/7-day charts, codes generated/used) for a portfolio-ready demo.
--
-- Generates:
--   • 100 fake quiz_sessions  — spread across the 4 stores and the last 28 days,
--     match% 45–98, ~92% "email sent", ~32% codes redeemed, 5 languages.
--   • A descending funnel      — 240 quiz_started → 165 result_shown → 100 claimed.
--
-- ⚠️  BEFORE RUNNING — DISABLE THE EMAIL WEBHOOK
--     Supabase Dashboard → Database → Webhooks → on-session-created → toggle OFF.
--     Inserting into quiz_sessions fires that webhook, and the function has no
--     "already sent" guard, so it would try to email all 100 fake addresses via
--     Brevo. Re-enable the webhook after the seed finishes.
--
-- 🧹  TO REMOVE THE DEMO DATA LATER (all rows are tagged):
--     DELETE FROM quiz_sessions      WHERE email LIKE '%@suaipe-demo.app';
--     DELETE FROM quiz_funnel_events WHERE funnel_key LIKE 'demo-%';
-- ════════════════════════════════════════════════════════════════════════════

BEGIN;

-- Wipe any previous demo run first, so this script is safe to re-run.
DELETE FROM public.quiz_sessions      WHERE email LIKE '%@suaipe-demo.app';
DELETE FROM public.quiz_funnel_events WHERE funnel_key LIKE 'demo-%';

-- ── 100 demo sessions ───────────────────────────────────────────────────────
INSERT INTO public.quiz_sessions
  (email, nome, cognome, answers, matched_product_id, match_percent, email_sent,
   store_id, product_name, product_price, product_image, discount_code,
   discount_percent, code_redeemed, code_redeemed_at, language,
   consent_given_at, created_at)
SELECT
  'demo+' || (1 + floor(random() * 78))::int || '@suaipe-demo.app',  -- ~78 unique → some returning visitors
  fn.v,
  ln.v,
  jsonb_build_object(
    '1', random() < .5, '2', random() < .5, '3', random() < .5, '4', random() < .5,
    '5', random() < .5, '6', random() < .5, '7', random() < .5, '8', random() < .5
  ),
  prod.id,
  (45 + floor(random() * 54))::int,                                  -- match_percent 45..98 (fills all brackets)
  (random() < 0.92),                                                 -- ~92% email delivered
  store.v,
  prod.name,
  prod.price,
  '/products/' || prod.id || '.png',
  'SUP-' || upper(substr(md5(random()::text || g::text), 1, 8)) || lpad(disc.v::text, 2, '0'),
  disc.v,
  red.v,                                                             -- ~32% codes redeemed
  CASE WHEN red.v THEN t.ts + ((1 + floor(random() * 72)) || ' hours')::interval ELSE NULL END,
  lng.v,
  t.ts,
  t.ts
FROM generate_series(1, 100) AS g
CROSS JOIN LATERAL (
  SELECT date_trunc('day', now())
       - (floor(random() * 28)         || ' days')::interval
       + ((10 + floor(random() * 11))  || ' hours')::interval        -- store hours 10..20
       + (floor(random() * 60)         || ' minutes')::interval AS ts
) t
CROSS JOIN LATERAL (SELECT (ARRAY['rio-de-janeiro','lisboa','dublino','milano'])[1 + floor(random()*4)::int] AS v) store
CROSS JOIN LATERAL (SELECT (ARRAY[5,10,15])[1 + floor(random()*3)::int] AS v) disc
CROSS JOIN LATERAL (SELECT (random() < 0.32) AS v) red
CROSS JOIN LATERAL (SELECT (ARRAY['it','it','it','it','en','pt','es','fr'])[1 + floor(random()*8)::int] AS v) lng
CROSS JOIN LATERAL (SELECT (ARRAY[
  'Marco','Giulia','Luca','Sofia','Matteo','Chiara','Lorenzo','Aurora','Andrea','Martina',
  'Ana','João','Maria','Pedro','Beatriz','Tiago','Sean','Aoife','Conor','Niamh'
])[1 + floor(random()*20)::int] AS v) fn
CROSS JOIN LATERAL (SELECT (ARRAY[
  'Rossi','Russo','Ferrari','Esposito','Bianchi','Romano','Silva','Santos','Oliveira','Costa',
  'Murphy','Kelly','O''Brien','Walsh','Ryan','Conti','Greco','Bruno','Gallo','Lombardi'
])[1 + floor(random()*20)::int] AS v) ln
CROSS JOIN LATERAL (
  -- Aurae Pulse Pro + Pulsar Recover X appear twice → gentle "bestseller" skew.
  SELECT id, name, price FROM (VALUES
    ('aurae-pulse-pro','Aurae Pulse Pro','€89,00'),
    ('aurae-pulse-pro','Aurae Pulse Pro','€89,00'),
    ('pulsar-recover-x','Pulsar Recover X','€99,00'),
    ('pulsar-recover-x','Pulsar Recover X','€99,00'),
    ('lunaring-halo','Lunaring Halo','€99,00'),
    ('brevia-gopress','Brevia GoPress','€119,00'),
    ('vibewave-open','VibeWave Open','€79,00'),
    ('voltik-snapcell','Voltik SnapCell','€54,00'),
    ('aeris-glow','Aeris Glow','€89,00'),
    ('echobox-riff','EchoBox Riff','€64,00'),
    ('nimbus-sip','Nimbus Sip','€45,00'),
    ('lumio-air','Lumio Air','€149,00')
  ) AS p(id, name, price) ORDER BY random() LIMIT 1
) prod;

-- ── Funnel events — descending funnel (240 → 165 → 100) ─────────────────────
INSERT INTO public.quiz_funnel_events (funnel_key, event_type, store_id, created_at)
SELECT
  'demo-' || et.t || '-' || g,
  et.t,
  (ARRAY['rio-de-janeiro','lisboa','dublino','milano'])[1 + floor(random()*4)::int],
  date_trunc('day', now())
    - (floor(random() * 28)        || ' days')::interval
    + ((10 + floor(random() * 11)) || ' hours')::interval
FROM (VALUES ('quiz_started', 240), ('result_shown', 165), ('claimed', 100)) AS et(t, n)
CROSS JOIN LATERAL generate_series(1, et.n) AS g;

COMMIT;

-- Sanity check (optional):
-- SELECT store_id, count(*) FROM quiz_sessions WHERE email LIKE '%@suaipe-demo.app' GROUP BY store_id;
-- SELECT event_type, count(*) FROM quiz_funnel_events WHERE funnel_key LIKE 'demo-%' GROUP BY event_type;
