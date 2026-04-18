-- Add FAQ text columns to product_settings (3 Q&A pairs per product per store)
ALTER TABLE product_settings
  ADD COLUMN IF NOT EXISTS faq_q1 TEXT,
  ADD COLUMN IF NOT EXISTS faq_a1 TEXT,
  ADD COLUMN IF NOT EXISTS faq_q2 TEXT,
  ADD COLUMN IF NOT EXISTS faq_a2 TEXT,
  ADD COLUMN IF NOT EXISTS faq_q3 TEXT,
  ADD COLUMN IF NOT EXISTS faq_a3 TEXT;
