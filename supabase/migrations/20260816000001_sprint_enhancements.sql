-- Migration: Sprint 1, 2, & 3 Enhancements for Lemburin App
-- Description: Add PP 35/2021 work system, daily incentives, holiday flag, SPL attachment, and physical slip photo.

-- 1. Tabel employments: Tambah work_system, overtime_meal_allowance, overtime_transport_allowance
ALTER TABLE public.employments 
ADD COLUMN IF NOT EXISTS work_system VARCHAR(20) NOT NULL DEFAULT '5_days',
ADD COLUMN IF NOT EXISTS overtime_meal_allowance NUMERIC(12,2) NULL,
ADD COLUMN IF NOT EXISTS overtime_transport_allowance NUMERIC(12,2) NULL;

-- 2. Tabel overtime_entries: Tambah is_holiday dan attachment_url
ALTER TABLE public.overtime_entries 
ADD COLUMN IF NOT EXISTS is_holiday BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS attachment_url TEXT NULL;

-- 3. Tabel salary_verifications: Tambah slip_photo_url
ALTER TABLE public.salary_verifications 
ADD COLUMN IF NOT EXISTS slip_photo_url TEXT NULL;
