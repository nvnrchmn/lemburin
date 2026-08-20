-- ============================================================
-- BASELINE SCHEMA — Lemburin
-- Skema lengkap 5 tabel aplikasi + enum + trigger updated_at.
-- Idempotent: aman dijalankan di database yang sudah memiliki tabel
-- (menggunakan IF NOT EXISTS / DO block).
--
-- Urutan eksekusi yang disarankan:
--   1. 20260816000001_sprint_enhancements.sql (jika ada)
--   2. 20260820000001_baseline_schema.sql  (file ini)
--   3. 20260820000002_enable_rls.sql        (RLS policies)
-- ============================================================

-- ============ ENUM: formula_type ============
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'formula_type') THEN
    CREATE TYPE public.formula_type AS ENUM ('indonesia', 'flat_rate', 'custom');
  END IF;
END
$$;

-- ============ EXTENSION: uuid & pgcrypto ============
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============ TRIGGER HELPER: set_updated_at ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============ 1. PROFILES ============
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   VARCHAR(150) NOT NULL,
  avatar_url  TEXT NULL,
  timezone    VARCHAR(100) NOT NULL DEFAULT 'Asia/Jakarta',
  language    VARCHAR(10)  NOT NULL DEFAULT 'id',
  currency    VARCHAR(10)  NOT NULL DEFAULT 'IDR',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ 2. EMPLOYMENTS ============
CREATE TABLE IF NOT EXISTS public.employments (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name                 VARCHAR(200) NOT NULL,
  job_title                    VARCHAR(150) NULL,
  employee_code                VARCHAR(100) NULL,
  work_system                  VARCHAR(20) NOT NULL DEFAULT '5_days',
  basic_salary                 NUMERIC(12,2) NULL,
  allowance                    NUMERIC(12,2) NULL, -- legacy, pakai allowances_detail
  overtime_meal_allowance      NUMERIC(12,2) NULL,
  overtime_transport_allowance NUMERIC(12,2) NULL,
  ptkp_status                  VARCHAR(10) NOT NULL DEFAULT 'TK/0',
  has_bpjs_tk                  BOOLEAN NOT NULL DEFAULT TRUE,
  has_bpjs_kes                 BOOLEAN NOT NULL DEFAULT TRUE,
  allowances_detail            JSONB NULL,
  deductions_detail            JSONB NULL,
  start_date                   DATE NOT NULL,
  end_date                     DATE NULL,
  is_active                    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employments_user_id   ON public.employments(user_id);
CREATE INDEX IF NOT EXISTS idx_employments_is_active ON public.employments(is_active);

DROP TRIGGER IF EXISTS trg_employments_updated_at ON public.employments;
CREATE TRIGGER trg_employments_updated_at
  BEFORE UPDATE ON public.employments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ 3. PAY_PERIODS ============
CREATE TABLE IF NOT EXISTS public.pay_periods (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employment_id         UUID NOT NULL REFERENCES public.employments(id) ON DELETE CASCADE,
  period_name           VARCHAR(100) NOT NULL,
  start_date            DATE NOT NULL,
  end_date              DATE NOT NULL,
  formula_type          public.formula_type NOT NULL DEFAULT 'indonesia',
  flat_rate_amount      NUMERIC(12,2) NULL,
  custom_formula_config JSONB NULL,
  is_locked             BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_pay_periods_dates CHECK (start_date <= end_date)
);

CREATE INDEX IF NOT EXISTS idx_pay_periods_employment_id ON public.pay_periods(employment_id);
CREATE INDEX IF NOT EXISTS idx_pay_periods_start_date    ON public.pay_periods(start_date);
CREATE INDEX IF NOT EXISTS idx_pay_periods_end_date      ON public.pay_periods(end_date);

DROP TRIGGER IF EXISTS trg_pay_periods_updated_at ON public.pay_periods;
CREATE TRIGGER trg_pay_periods_updated_at
  BEFORE UPDATE ON public.pay_periods
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ 4. OVERTIME_ENTRIES ============
CREATE TABLE IF NOT EXISTS public.overtime_entries (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pay_period_id  UUID NOT NULL REFERENCES public.pay_periods(id) ON DELETE CASCADE,
  work_date      DATE NOT NULL,
  start_time     TIME NOT NULL,
  end_time       TIME NOT NULL,
  break_minutes  INTEGER NOT NULL DEFAULT 0,
  is_holiday     BOOLEAN NOT NULL DEFAULT FALSE,
  attachment_url TEXT NULL,
  notes          TEXT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_overtime_break_minutes CHECK (break_minutes >= 0),
  CONSTRAINT chk_overtime_times CHECK (end_time <> start_time)
);

CREATE INDEX IF NOT EXISTS idx_overtime_entries_pay_period_id ON public.overtime_entries(pay_period_id);
CREATE INDEX IF NOT EXISTS idx_overtime_entries_work_date     ON public.overtime_entries(work_date);

DROP TRIGGER IF EXISTS trg_overtime_entries_updated_at ON public.overtime_entries;
CREATE TRIGGER trg_overtime_entries_updated_at
  BEFORE UPDATE ON public.overtime_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ 5. SALARY_VERIFICATIONS ============
CREATE TABLE IF NOT EXISTS public.salary_verifications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pay_period_id  UUID NOT NULL UNIQUE REFERENCES public.pay_periods(id) ON DELETE CASCADE,
  slip_amount    NUMERIC(12,2) NOT NULL DEFAULT 0,
  deduction      NUMERIC(12,2) NULL,
  difference     NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes          TEXT NULL,
  slip_photo_url TEXT NULL,
  verified_at    TIMESTAMPTZ NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_salary_verifications_updated_at ON public.salary_verifications;
CREATE TRIGGER trg_salary_verifications_updated_at
  BEFORE UPDATE ON public.salary_verifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ GRANT (default Supabase: anon/authenticated) ============
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
