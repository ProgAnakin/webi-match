-- ── product_settings ────────────────────────────────────────────────────────
-- Stores the active/inactive toggle per product.
-- Product catalogue data (name, description, FAQ, price…) stays in code;
-- only the on/off state lives here so the manager can update it without
-- requiring a developer to redeploy.

CREATE TABLE IF NOT EXISTS public.product_settings (
  product_id  TEXT        PRIMARY KEY,
  active      BOOLEAN     NOT NULL DEFAULT TRUE,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.product_settings ENABLE ROW LEVEL SECURITY;

-- SELECT is public: the quiz app (anon key) reads which products are active.
CREATE POLICY "product_settings_select_public"
  ON public.product_settings
  FOR SELECT
  USING (true);

-- INSERT / UPDATE restricted to authenticated users (manager panel).
CREATE POLICY "product_settings_write_authenticated"
  ON public.product_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Seed all current products as active.
-- ON CONFLICT DO NOTHING → safe to re-run without wiping existing toggles.
INSERT INTO public.product_settings (product_id, active) VALUES
  ('blnd-blender',         true),
  ('fitring-air',          true),
  ('head-hdtw01',          true),
  ('ksix-saturn',          true),
  ('laifen-neo',           true),
  ('muzen-otr',            true),
  ('outin-nano',            true),
  ('terraillon-massager',  true),
  ('veho-pebble-mg5',      true),
  ('veho-zb7',             true)
ON CONFLICT (product_id) DO NOTHING;
