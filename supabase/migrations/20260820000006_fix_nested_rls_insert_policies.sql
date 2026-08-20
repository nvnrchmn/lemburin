-- ============================================================
-- Fix: use the SECURITY DEFINER ownership helper in nested inserts
--
-- Direct EXISTS joins inside an overtime_entries RLS policy can be
-- evaluated through the caller's RLS visibility on pay_periods and
-- employments. The ownership helper is SECURITY DEFINER and is the
-- canonical check for a pay period belonging to the authenticated user.
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
