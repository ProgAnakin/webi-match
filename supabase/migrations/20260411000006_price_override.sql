-- Add price_override to product_settings so managers can override
-- the default price per product per store without changing the source code.
ALTER TABLE public.product_settings
  ADD COLUMN IF NOT EXISTS price_override TEXT;
