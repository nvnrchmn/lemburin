-- ============================================================
-- RLS (Row Level Security) — Lemburin
-- Keamanan data: setiap user HANYA bisa akses baris miliknya sendiri.
-- Wajib dijalankan setelah baseline schema.
--
-- Struktur relasi:
--   profiles (user_id) ── 1:1 ── auth.users
--   employments (user_id) ── 1:N ── profiles
--   pay_periods (employment_id) ── N:1 ── employments
--   overtime_entries (pay_period_id) ── N:1 ── pay_periods
--   salary_verifications (pay_period_id) ── N:1 ── pay_periods
-- ============================================================

-- ============ 1. PROFILES ============
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = user_id);

-- ============ 2. EMPLOYMENTS ============
ALTER TABLE public.employments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own employments" ON public.employments;
CREATE POLICY "Users can view own employments"
  ON public.employments FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own employments" ON public.employments;
CREATE POLICY "Users can insert own employments"
  ON public.employments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own employments" ON public.employments;
CREATE POLICY "Users can update own employments"
  ON public.employments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own employments" ON public.employments;
CREATE POLICY "Users can delete own employments"
  ON public.employments FOR DELETE
  USING (auth.uid() = user_id);

-- ============ 3. PAY_PERIODS (via employment owner) ============
ALTER TABLE public.pay_periods ENABLE ROW LEVEL SECURITY;

-- Helper: cek kepemilikan pay_period melalui employment milik user
CREATE OR REPLACE FUNCTION public.pay_period_belongs_to_user(p_pay_period_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.pay_periods pp
    JOIN public.employments e ON e.id = pp.employment_id
    WHERE pp.id = p_pay_period_id
      AND e.user_id = auth.uid()
  );
$$;

DROP POLICY IF EXISTS "Users can view own pay_periods" ON public.pay_periods;
CREATE POLICY "Users can view own pay_periods"
  ON public.pay_periods FOR SELECT
  USING (public.pay_period_belongs_to_user(id));

DROP POLICY IF EXISTS "Users can insert own pay_periods" ON public.pay_periods;
CREATE POLICY "Users can insert own pay_periods"
  ON public.pay_periods FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employments e
      WHERE e.id = employment_id AND e.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own pay_periods" ON public.pay_periods;
CREATE POLICY "Users can update own pay_periods"
  ON public.pay_periods FOR UPDATE
  USING (public.pay_period_belongs_to_user(id))
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employments e
      WHERE e.id = employment_id AND e.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own pay_periods" ON public.pay_periods;
CREATE POLICY "Users can delete own pay_periods"
  ON public.pay_periods FOR DELETE
  USING (public.pay_period_belongs_to_user(id));

-- ============ 4. OVERTIME_ENTRIES (via pay_period) ============
ALTER TABLE public.overtime_entries ENABLE ROW LEVEL SECURITY;

-- Helper: cek kepemilikan overtime entry melalui pay_period -> employment
CREATE OR REPLACE FUNCTION public.overtime_entry_belongs_to_user(p_entry_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.overtime_entries oe
    JOIN public.pay_periods pp ON pp.id = oe.pay_period_id
    JOIN public.employments e ON e.id = pp.employment_id
    WHERE oe.id = p_entry_id
      AND e.user_id = auth.uid()
  );
$$;

DROP POLICY IF EXISTS "Users can view own overtime_entries" ON public.overtime_entries;
CREATE POLICY "Users can view own overtime_entries"
  ON public.overtime_entries FOR SELECT
  USING (public.overtime_entry_belongs_to_user(id));

DROP POLICY IF EXISTS "Users can insert own overtime_entries" ON public.overtime_entries;
CREATE POLICY "Users can insert own overtime_entries"
  ON public.overtime_entries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pay_periods pp
      JOIN public.employments e ON e.id = pp.employment_id
      WHERE pp.id = pay_period_id AND e.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own overtime_entries" ON public.overtime_entries;
CREATE POLICY "Users can update own overtime_entries"
  ON public.overtime_entries FOR UPDATE
  USING (public.overtime_entry_belongs_to_user(id))
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pay_periods pp
      JOIN public.employments e ON e.id = pp.employment_id
      WHERE pp.id = pay_period_id AND e.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own overtime_entries" ON public.overtime_entries;
CREATE POLICY "Users can delete own overtime_entries"
  ON public.overtime_entries FOR DELETE
  USING (public.overtime_entry_belongs_to_user(id));

-- ============ 5. SALARY_VERIFICATIONS (via pay_period) ============
ALTER TABLE public.salary_verifications ENABLE ROW LEVEL SECURITY;

-- Helper: cek kepemilikan salary verification melalui pay_period
CREATE OR REPLACE FUNCTION public.salary_verification_belongs_to_user(p_verif_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.salary_verifications sv
    JOIN public.pay_periods pp ON pp.id = sv.pay_period_id
    JOIN public.employments e ON e.id = pp.employment_id
    WHERE sv.id = p_verif_id
      AND e.user_id = auth.uid()
  );
$$;

DROP POLICY IF EXISTS "Users can view own salary_verifications" ON public.salary_verifications;
CREATE POLICY "Users can view own salary_verifications"
  ON public.salary_verifications FOR SELECT
  USING (public.salary_verification_belongs_to_user(id));

DROP POLICY IF EXISTS "Users can insert own salary_verifications" ON public.salary_verifications;
CREATE POLICY "Users can insert own salary_verifications"
  ON public.salary_verifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pay_periods pp
      JOIN public.employments e ON e.id = pp.employment_id
      WHERE pp.id = pay_period_id AND e.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own salary_verifications" ON public.salary_verifications;
CREATE POLICY "Users can update own salary_verifications"
  ON public.salary_verifications FOR UPDATE
  USING (public.salary_verification_belongs_to_user(id))
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pay_periods pp
      JOIN public.employments e ON e.id = pp.employment_id
      WHERE pp.id = pay_period_id AND e.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own salary_verifications" ON public.salary_verifications;
CREATE POLICY "Users can delete own salary_verifications"
  ON public.salary_verifications FOR DELETE
  USING (public.salary_verification_belongs_to_user(id));

-- ============ REVOKE PUBLIC EXECUTION (helper hanya untuk internal) ============
REVOKE ALL ON FUNCTION public.pay_period_belongs_to_user(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.overtime_entry_belongs_to_user(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.salary_verification_belongs_to_user(uuid) FROM PUBLIC;
