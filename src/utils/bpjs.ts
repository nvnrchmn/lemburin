/**
 * Modul Perhitungan Potongan BPJS Karyawan Resmi Indonesia
 * - BPJS Ketenagakerjaan JHT: 2% dari Gaji Pokok & Tunjangan Tetap
 * - BPJS Ketenagakerjaan JP (Jaminan Pensiun): 1% (Batas Maksimal/Ceiling 2024: Rp 10.042.300)
 * - BPJS Kesehatan: 1% (Batas Maksimal/Ceiling: Rp 12.000.000)
 */

export const BPJS_JP_CEILING = 10042300;
export const BPJS_KES_CEILING = 12000000;

export interface BpjsDeductionResult {
  jht: number;       // 2%
  jp: number;        // 1%
  kesehatan: number; // 1%
  totalBpjs: number;
}

export function calculateBpjsDeductions(
  basicSalary: number,
  fixedAllowance: number = 0,
  hasBpjsTk: boolean = true,
  hasBpjsKes: boolean = true
): BpjsDeductionResult {
  const wageBase = Math.max(0, basicSalary + fixedAllowance);

  if (wageBase <= 0) {
    return { jht: 0, jp: 0, kesehatan: 0, totalBpjs: 0 };
  }

  // 1. BPJS Ketenagakerjaan JHT: 2%
  const jht = hasBpjsTk ? Math.round(wageBase * 0.02) : 0;

  // 2. BPJS Ketenagakerjaan JP: 1% (dengan ceiling)
  const jpWageBase = Math.min(wageBase, BPJS_JP_CEILING);
  const jp = hasBpjsTk ? Math.round(jpWageBase * 0.01) : 0;

  // 3. BPJS Kesehatan: 1% (dengan ceiling)
  const kesWageBase = Math.min(wageBase, BPJS_KES_CEILING);
  const kesehatan = hasBpjsKes ? Math.round(kesWageBase * 0.01) : 0;

  const totalBpjs = jht + jp + kesehatan;

  return {
    jht,
    jp,
    kesehatan,
    totalBpjs,
  };
}
