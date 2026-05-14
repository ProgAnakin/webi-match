-- Dynamic quiz cards table.
-- Replaces the static src/data/questions.ts array at runtime.
-- text_it is the authoritative Italian text; other lang fields are optional
-- (null → falls back to text_it in the app). The "Traduci" button in the
-- manager UI is built but disabled — translation API integration is future work.

CREATE TABLE quiz_cards (
  id         SERIAL PRIMARY KEY,
  emoji      TEXT NOT NULL DEFAULT '❓',
  tag        TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  text_it    TEXT NOT NULL DEFAULT '',
  text_en    TEXT,
  text_pt    TEXT,
  text_es    TEXT,
  text_fr    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE quiz_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon read quiz_cards"   ON quiz_cards FOR SELECT TO anon USING (true);
CREATE POLICY "anon manage quiz_cards" ON quiz_cards FOR ALL    TO anon USING (true) WITH CHECK (true);

-- Seed with the 8 existing static questions (IDs match TAG_MAP in products.ts)
INSERT INTO quiz_cards (id, emoji, tag, sort_order, active, text_it, text_en, text_pt, text_es, text_fr) VALUES
(1, '🏋️', 'sport',        1, true,
  'Ti alleni regolarmente o pratichi sport?',
  'Do you train regularly or practice sports?',
  'Você se exercita regularmente ou pratica esportes?',
  '¿Entrenas regularmente o practicas deporte?',
  'Tu t''entraînes régulièrement ou pratiques un sport ?'),
(2, '🎵', 'audio',        2, true,
  'La musica è sempre con te, anche durante l''allenamento?',
  'Is music always with you, even during training?',
  'A música está sempre com você, mesmo durante o treino?',
  '¿La música siempre está contigo, incluso durante el entrenamiento?',
  'La musique est toujours avec toi, même pendant l''entraînement ?'),
(3, '⚡', 'productivity', 3, true,
  'Cerchi sempre modi per ottimizzare il tuo tempo?',
  'Are you always looking for ways to optimize your time?',
  'Você está sempre buscando maneiras de otimizar seu tempo?',
  '¿Siempre buscas formas de optimizar tu tiempo?',
  'Tu cherches toujours des moyens d''optimiser ton temps ?'),
(4, '🌿', 'wellness',     4, true,
  'Dedichi ogni giorno del tempo alla cura di te stesso?',
  'Do you dedicate time every day to taking care of yourself?',
  'Você dedica tempo todos os dias para cuidar de si mesmo?',
  '¿Dedicas tiempo cada día a cuidarte?',
  'Tu consacres du temps chaque jour à prendre soin de toi ?'),
(5, '✈️', 'travel',       5, true,
  'Sei spesso in movimento o viaggi fuori casa?',
  'Are you often on the move or traveling away from home?',
  'Você está frequentemente em movimento ou viajando fora de casa?',
  '¿Estás frecuentemente en movimiento o viajando fuera de casa?',
  'Tu es souvent en déplacement ou tu voyages loin de chez toi ?'),
(6, '💡', 'tech',         6, true,
  'Ami i gadget smart che tracciano salute e attività?',
  'Do you love smart gadgets that track health and activity?',
  'Você ama gadgets inteligentes que rastreiam saúde e atividades?',
  '¿Te encantan los gadgets inteligentes que rastrean la salud y la actividad?',
  'Tu aimes les gadgets intelligents qui suivent la santé et l''activité ?'),
(7, '✨', 'style',        7, true,
  'Il design e l''estetica degli oggetti contano tanto per te?',
  'Do the design and aesthetics of objects matter a lot to you?',
  'O design e a estética dos objetos importam muito para você?',
  '¿El diseño y la estética de los objetos importan mucho para ti?',
  'Le design et l''esthétique des objets comptent beaucoup pour toi ?'),
(8, '🌙', 'recovery',     8, true,
  'Il recupero fisico e il sonno di qualità sono una priorità?',
  'Is physical recovery and quality sleep a priority?',
  'A recuperação física e o sono de qualidade são uma prioridade?',
  '¿La recuperación física y el sueño de calidad son una prioridad?',
  'La récupération physique et le sommeil de qualité sont une priorité ?');

-- Advance the serial so new cards inserted by the manager start at 9+
SELECT setval('quiz_cards_id_seq', 8);
