-- Adds a single YouTube video link to each consultant product guide.
-- The manager pastes the link in /manager → Gestione → Guide; consultants
-- watch the 30-second explainer inline in /consulente. One link per product;
-- it is not language-specific.
ALTER TABLE public.product_guides
  ADD COLUMN IF NOT EXISTS video_url text NOT NULL DEFAULT '';

NOTIFY pgrst, 'reload schema';
