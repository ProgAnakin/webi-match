-- Grant EXECUTE on the 4-parameter verify_staff_pin added in 20260429000001.
-- The original migration replaced the function body but forgot the GRANT,
-- so calling the 4-param version from anon/authenticated roles would fail
-- with "permission denied". The Edge Function (service_role) was unaffected,
-- but the direct-RPC fallback path in AdminPinOverlay was.

GRANT EXECUTE ON FUNCTION public.verify_staff_pin(text, text, text, text)
  TO anon, authenticated;
