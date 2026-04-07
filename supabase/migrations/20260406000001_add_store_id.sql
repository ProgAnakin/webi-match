-- ─── Add store_id to product_settings ────────────────────────────────────────
-- Adds a store_id column and changes the primary key from (product_id) to
-- (product_id, store_id) so each store can independently toggle products.

ALTER TABLE public.product_settings
  ADD COLUMN IF NOT EXISTS store_id TEXT NOT NULL DEFAULT 'corso-vercelli';

-- Drop old single-column PK and rebuild as composite
ALTER TABLE public.product_settings
  DROP CONSTRAINT IF EXISTS product_settings_pkey;

ALTER TABLE public.product_settings
  ADD PRIMARY KEY (product_id, store_id);

-- ─── Add store_id to quiz_sessions ────────────────────────────────────────────
-- Records which physical store the quiz session originated from.

ALTER TABLE public.quiz_sessions
  ADD COLUMN IF NOT EXISTS store_id TEXT;

-- Index for fast per-store analytics queries
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_store_id
  ON public.quiz_sessions (store_id);
