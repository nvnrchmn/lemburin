-- ============================================================
-- FIX: cegah duplikat & overlap pay_periods
-- Masalah: aplikasi bisa membuat 2+ periode dalam rentang yang sama
-- (race condition di client) karena tidak ada constraint di DB.
--
-- Solusi (2 lapis):
--   1. UNIQUE (employment_id, start_date, end_date) — cegah duplikat persis
--   2. EXCLUDE gist daterange — cegah periode yang saling overlap
-- ============================================================

-- 1. Extension untuk EXCLUDE constraint (idempotent)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2. Hapus duplikat yang sudah terlanjur ada (pertahankan 1 per rentang)
--    Entri lembur & verifikasi di periode duplikat dipindah ke periode pertama.
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY employment_id, start_date, end_date
           ORDER BY created_at ASC
         ) AS rn
  FROM public.pay_periods
)
-- Pindahkan entri lembur dari periode duplikat ke periode kanonik (rn=1)
UPDATE public.overtime_entries oe
SET pay_period_id = r.id
FROM ranked dup
JOIN public.pay_periods r
  ON r.employment_id = dup.employment_id
 AND r.start_date   = dup.start_date
 AND r.end_date     = dup.end_date
 AND r.created_at  <= dup.created_at
WHERE oe.pay_period_id = dup.id
  AND dup.rn > 1;

-- Pindahkan salary_verifications dari periode duplikat
UPDATE public.salary_verifications sv
SET pay_period_id = r.id
FROM ranked dup
JOIN public.pay_periods r
  ON r.employment_id = dup.employment_id
 AND r.start_date   = dup.start_date
 AND r.end_date     = dup.end_date
 AND r.created_at  <= dup.created_at
WHERE sv.pay_period_id = dup.id
  AND dup.rn > 1;

-- Hapus periode duplikat
DELETE FROM public.pay_periods p
USING ranked dup
WHERE p.id = dup.id AND dup.rn > 1;

-- 3. Constraint UNIQUE
ALTER TABLE public.pay_periods
DROP CONSTRAINT IF EXISTS uq_pay_periods_employment_range;
ALTER TABLE public.pay_periods
ADD CONSTRAINT uq_pay_periods_employment_range
  UNIQUE (employment_id, start_date, end_date);

-- 4. Constraint EXCLUDE anti-overlap
ALTER TABLE public.pay_periods
DROP CONSTRAINT IF EXISTS chk_pay_periods_no_overlap;
ALTER TABLE public.pay_periods
ADD CONSTRAINT chk_pay_periods_no_overlap
  EXCLUDE USING gist (
    employment_id WITH =,
    daterange(start_date, end_date, '[)') WITH &&
  );
