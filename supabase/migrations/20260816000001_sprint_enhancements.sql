-- Migration: Sprint 1, 2, 3, & 4 Enhancements for Lemburin App
-- Description: Add PP 35/2021 work system, daily incentives, holiday flag, SPL attachment, physical slip photo, PTKP PPh 21 TER, and BPJS options.

-- 1. Tabel employments: Tambah work_system, overtime_meal_allowance, overtime_transport_allowance, ptkp_status, has_bpjs_tk, has_bpjs_kes
ALTER TABLE public.employments 
ADD COLUMN IF NOT EXISTS work_system VARCHAR(20) NOT NULL DEFAULT '5_days',
ADD COLUMN IF NOT EXISTS overtime_meal_allowance NUMERIC(12,2) NULL,
ADD COLUMN IF NOT EXISTS overtime_transport_allowance NUMERIC(12,2) NULL,
ADD COLUMN IF NOT EXISTS ptkp_status VARCHAR(10) NOT NULL DEFAULT 'TK/0',
ADD COLUMN IF NOT EXISTS has_bpjs_tk BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS has_bpjs_kes BOOLEAN NOT NULL DEFAULT TRUE;

-- 2. Tabel overtime_entries: Tambah is_holiday dan attachment_url
ALTER TABLE public.overtime_entries 
ADD COLUMN IF NOT EXISTS is_holiday BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS attachment_url TEXT NULL;

-- 3. Tabel salary_verifications: Tambah slip_photo_url
ALTER TABLE public.salary_verifications 
ADD COLUMN IF NOT EXISTS slip_photo_url TEXT NULL;
