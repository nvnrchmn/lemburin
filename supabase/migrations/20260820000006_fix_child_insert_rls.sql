-- ============================================================
-- Fix: use the SECURITY DEFINER ownership helper for child inserts
--
-- The previous overtime_entries INSERT policy queried pay_periods and
-- employments directly from inside a child-table RLS policy. Depending
-- on the active RLS policy chain, the parent lookup can be invisible
-- even when the authenticated user owns the period, causing SQLSTATE
-- 42501: new row violates row-level security policy.
-- ============================================================

DROP POLICY IF EXISTS "Users can insert own overtime_entries" ON public.overtime_entries;
CREATE POLICY "Users can insert own overtime_entries"
  ON public.overtime_entries FOR INSERT
  WITH CHECK (public.pay_period_belongs_to_user(pay_period_id));

DROP POLICY IF EXISTS "Users can update own overtime_entries" ON public.overtime_entries;
CREATE POLICY "Users can update own overtime_entries"
  ON public.overtime_entries FOR UPDATE
  USING (public.overtime_entry_belongs_to_user(id))
  WITH CHECK (public.pay_period_belongs_to_user(pay_period_id));

DROP POLICY IF EXISTS "Users can insert own salary_verifications" ON public.salary_verifications;
CREATE POLICY "Users can insert own salary_verifications"
  ON public.salary_verifications FOR INSERT
  WITH CHECK (public.pay_period_belongs_to_user(pay_period_id));

DROP POLICY IF EXISTS "Users can update own salary_verifications" ON public.salary_verifications;
CREATE POLICY "Users can update own salary_verifications"
  ON public.salary_verifications FOR UPDATE
  USING (public.salary_verification_belongs_to_user(id))
  WITH CHECK (public.pay_period_belongs_to_user(pay_period_id));
