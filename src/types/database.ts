/**
 * Lemburin Database Types
 * Generated from 07_DATABASE_SCHEMA.md
 */

export type FormulaType = 'indonesia' | 'flat_rate' | 'custom';

export type VerificationStatus = 'matched' | 'mismatched' | 'pending';

export interface SalaryComponent {
  id: string;
  name: string;
  amount: number;
  is_fixed?: boolean;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  timezone: string;
  language: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Employment {
  id: string;
  user_id: string;
  company_name: string;
  job_title: string | null;
  employee_code: string | null;
  basic_salary: number | null;
  allowance: number | null; // legacy
  allowances_detail: SalaryComponent[] | null;
  deductions_detail: SalaryComponent[] | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PayPeriod {
  id: string;
  employment_id: string;
  period_name: string;
  start_date: string;
  end_date: string;
  formula_type: FormulaType;
  flat_rate_amount: number | null;
  custom_formula_config: Record<string, unknown> | null;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface OvertimeEntry {
  id: string;
  pay_period_id: string;
  work_date: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SalaryVerification {
  id: string;
  pay_period_id: string;
  slip_amount: number;
  deduction: number | null;
  difference: number;
  notes: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

// Supabase Database type for typed client
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
      };
      employments: {
        Row: Employment;
        Insert: Omit<Employment, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Employment, 'id' | 'created_at' | 'updated_at'>>;
      };
      pay_periods: {
        Row: PayPeriod;
        Insert: Omit<PayPeriod, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<PayPeriod, 'id' | 'created_at' | 'updated_at'>>;
      };
      overtime_entries: {
        Row: OvertimeEntry;
        Insert: Omit<OvertimeEntry, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<OvertimeEntry, 'id' | 'created_at' | 'updated_at'>>;
      };
      salary_verifications: {
        Row: SalaryVerification;
        Insert: Omit<SalaryVerification, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<SalaryVerification, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      formula_type: FormulaType;
    };
  };
}
