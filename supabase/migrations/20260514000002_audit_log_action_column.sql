-- Add action and old_active columns to manager_audit_log so quiz card
-- operations (add/edit/toggle/reorder) can be recorded alongside product toggles.

ALTER TABLE public.manager_audit_log
  ADD COLUMN IF NOT EXISTS action TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS old_active BOOLEAN DEFAULT NULL;

-- Backfill: existing rows are product toggles, set action accordingly.
UPDATE public.manager_audit_log
  SET action = 'product_toggle'
  WHERE action IS NULL AND new_active IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.manager_audit_log (action);
