-- Multi-store role management RPCs for the /manager dashboard.
--
-- Before this migration, store_roles could only be edited via the Supabase
-- dashboard with the service role key. This adds three SECURITY DEFINER
-- functions so an authenticated `manager` can list / upsert / delete roles
-- from the UI without ever needing the service role key in the browser.
--
-- All three functions are guarded by an inline `get_my_store_role()` check;
-- non-managers receive an exception and a HTTP 4xx surfaces to the UI.

-- ── 1. list_store_roles_admin ─────────────────────────────────────────────────
-- Returns every store_roles row joined to auth.users.email so the UI can show
-- a human-readable name. The caller must be a manager.
CREATE OR REPLACE FUNCTION public.list_store_roles_admin()
RETURNS TABLE (
  id          uuid,
  user_id     uuid,
  user_email  text,
  role        text,
  store_id    text,
  created_at  timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  caller_role text;
BEGIN
  SELECT sr.role INTO caller_role
  FROM public.store_roles sr
  WHERE sr.user_id = auth.uid()
  LIMIT 1;

  IF caller_role IS DISTINCT FROM 'manager' THEN
    RAISE EXCEPTION 'forbidden: caller is not a manager'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
    SELECT sr.id, sr.user_id, u.email::text, sr.role, sr.store_id, sr.created_at
    FROM public.store_roles sr
    JOIN auth.users u ON u.id = sr.user_id
    ORDER BY sr.created_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.list_store_roles_admin() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.list_store_roles_admin() TO authenticated;

-- ── 2. upsert_store_role_admin ────────────────────────────────────────────────
-- Inserts or updates a role for the given email. `p_store_id` is nullable —
-- pass NULL for `manager` (access to every store) or a slug for
-- `consulente_responsabile`.
CREATE OR REPLACE FUNCTION public.upsert_store_role_admin(
  p_user_email text,
  p_role       text,
  p_store_id   text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  caller_role  text;
  target_uid   uuid;
  inserted_id  uuid;
BEGIN
  -- Authorization
  SELECT sr.role INTO caller_role
  FROM public.store_roles sr
  WHERE sr.user_id = auth.uid()
  LIMIT 1;

  IF caller_role IS DISTINCT FROM 'manager' THEN
    RAISE EXCEPTION 'forbidden: caller is not a manager'
      USING ERRCODE = '42501';
  END IF;

  IF p_role NOT IN ('manager', 'consulente_responsabile') THEN
    RAISE EXCEPTION 'invalid role: %', p_role USING ERRCODE = '22023';
  END IF;

  IF p_role = 'consulente_responsabile' AND (p_store_id IS NULL OR length(trim(p_store_id)) = 0) THEN
    RAISE EXCEPTION 'consulente_responsabile requires a store_id' USING ERRCODE = '22023';
  END IF;

  -- Look up the target user by email (case-insensitive).
  SELECT u.id INTO target_uid
  FROM auth.users u
  WHERE lower(u.email) = lower(trim(p_user_email))
  LIMIT 1;

  IF target_uid IS NULL THEN
    RAISE EXCEPTION 'no auth user found for email: %', p_user_email
      USING ERRCODE = 'P0002';
  END IF;

  -- store_roles has UNIQUE(user_id) — ON CONFLICT replaces the existing row.
  INSERT INTO public.store_roles (user_id, role, store_id)
  VALUES (target_uid, p_role, NULLIF(trim(p_store_id), ''))
  ON CONFLICT (user_id) DO UPDATE
    SET role = EXCLUDED.role,
        store_id = EXCLUDED.store_id
  RETURNING id INTO inserted_id;

  RETURN inserted_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.upsert_store_role_admin(text, text, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.upsert_store_role_admin(text, text, text) TO authenticated;

-- ── 3. delete_store_role_admin ────────────────────────────────────────────────
-- Removes a role row by id. The caller can NOT delete their own row (would
-- lock themselves out); the function refuses that case explicitly.
CREATE OR REPLACE FUNCTION public.delete_store_role_admin(p_role_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  caller_role text;
  target_uid  uuid;
  deleted     integer;
BEGIN
  SELECT sr.role INTO caller_role
  FROM public.store_roles sr
  WHERE sr.user_id = auth.uid()
  LIMIT 1;

  IF caller_role IS DISTINCT FROM 'manager' THEN
    RAISE EXCEPTION 'forbidden: caller is not a manager'
      USING ERRCODE = '42501';
  END IF;

  SELECT sr.user_id INTO target_uid
  FROM public.store_roles sr
  WHERE sr.id = p_role_id;

  IF target_uid IS NULL THEN
    RETURN 0;
  END IF;

  IF target_uid = auth.uid() THEN
    RAISE EXCEPTION 'cannot delete own role (would lock yourself out)'
      USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.store_roles WHERE id = p_role_id;
  GET DIAGNOSTICS deleted = ROW_COUNT;
  RETURN deleted;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_store_role_admin(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.delete_store_role_admin(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
