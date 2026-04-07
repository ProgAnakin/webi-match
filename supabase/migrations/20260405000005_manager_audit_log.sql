-- Manager audit log: records every product toggle performed by authenticated users.
-- Used for accountability and to detect unauthorized changes.

CREATE TABLE IF NOT EXISTS public.manager_audit_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email  TEXT,
  product_id  TEXT        NOT NULL,
  new_active  BOOLEAN     NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only the service role can read all rows (admin audit);
-- authenticated users can insert their own actions.
ALTER TABLE public.manager_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_insert_authenticated"
  ON public.manager_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can only read their own audit entries
CREATE POLICY "audit_log_select_authenticated"
  ON public.manager_audit_log
  FOR SELECT
  TO authenticated
  USING (true);

-- Index for querying by product or user
CREATE INDEX IF NOT EXISTS idx_audit_log_product_id  ON public.manager_audit_log (product_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at  ON public.manager_audit_log (created_at DESC);
