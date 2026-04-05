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
  ('airpulse-pro',    true),
  ('fitcore-band',    true),
  ('flashdeck-mini',  true),
  ('clipcam-360',     true),
  ('voicebox-studio', true),
  ('sleeppod-neo',    true),
  ('ergoflow-chair',  true),
  ('trailcam-pro',    true),
  ('nexpad-gaming',   true),
  ('nomad-charger',   true)
ON CONFLICT (product_id) DO NOTHING;
