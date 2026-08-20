-- ============================================================
-- Fix nested RLS checks for writes through pay_periods
--
-- Direct EXISTS queries against pay_periods/employments inside an
-- overtime_entries policy can be filtered by the referenced tables'
-- own RLS policies. Use the SECURITY DEFINER ownership helper instead.
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
