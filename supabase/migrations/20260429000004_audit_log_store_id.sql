-- Add store_id to manager_audit_log so consulente_responsabile can be
-- filtered to their own sede in future RLS policies.
-- Existing rows get NULL (unknown store — harmless for historical data).

ALTER TABLE public.manager_audit_log
  ADD COLUMN IF NOT EXISTS store_id text DEFAULT NULL;

-- Drop the old permissive select policy and replace with role-aware ones.
DROP POLICY IF EXISTS "audit_log_select_authenticated" ON public.manager_audit_log;

CREATE POLICY "manager_read_audit_log"
  ON public.manager_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.store_roles sr
      WHERE sr.user_id = auth.uid()
        AND sr.role = 'manager'
    )
  );

CREATE POLICY "consulente_read_audit_log"
  ON public.manager_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.store_roles sr
      WHERE sr.user_id = auth.uid()
        AND sr.role = 'consulente_responsabile'
        AND sr.store_id = manager_audit_log.store_id
    )
  );
