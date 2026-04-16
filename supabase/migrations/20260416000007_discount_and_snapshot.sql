-- Add discount_percent to product_settings
-- Manager can set 5%, 8%, or 10% per product per store.
-- This value controls the last 2 digits of the generated discount code:
--   WEBI-XXXX05 | WEBI-XXXX08 | WEBI-XXXX10
ALTER TABLE product_settings
  ADD COLUMN IF NOT EXISTS discount_percent INTEGER NOT NULL DEFAULT 5
    CHECK (discount_percent IN (5, 8, 10));

-- Add missing snapshot + discount columns to quiz_sessions.
-- These are written at claim-time so the edge function has everything it needs
-- without joining back to product_settings.
ALTER TABLE quiz_sessions
  ADD COLUMN IF NOT EXISTS product_name    TEXT,
  ADD COLUMN IF NOT EXISTS product_price   TEXT,
  ADD COLUMN IF NOT EXISTS product_image   TEXT,
  ADD COLUMN IF NOT EXISTS product_video   TEXT,
  ADD COLUMN IF NOT EXISTS discount_code   TEXT,
  ADD COLUMN IF NOT EXISTS discount_percent INTEGER;
