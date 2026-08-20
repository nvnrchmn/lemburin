-- ============================================================
-- Fix: RLS helper functions must be executable by authenticated users
--
-- The policies call these SECURITY DEFINER helper functions. The
-- previous migration revoked PUBLIC execution but did not grant
-- EXECUTE to the authenticated role, causing SQLSTATE 42501:
-- "permission denied for function pay_period_belongs_to_user".
-- ============================================================

GRANT EXECUTE ON FUNCTION public.pay_period_belongs_to_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.overtime_entry_belongs_to_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.salary_verification_belongs_to_user(uuid) TO authenticated;
