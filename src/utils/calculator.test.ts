import { describe, it, expect } from 'vitest';
import {
  calculateOvertimeMinutes,
  calculateDuration,
  calculateOvertimePay,
  calculateTotalFixedAllowance,
  calculateTotalAllowance,
  calculateTotalDeduction,
} from './calculator';
import type { SalaryComponent } from '@/types/database';

describe('calculateOvertimeMinutes', () => {
  it('menghitung durasi normal', () => {
    expect(calculateOvertimeMinutes('18:00', '20:00')).toBe(120);
  });

  it('mengurangi waktu istirahat', () => {
    expect(calculateOvertimeMinutes('18:00', '21:00', 30)).toBe(150);
  });

  it('menangani lembur lintas tengah malam (overnight)', () => {
    expect(calculateOvertimeMinutes('22:00', '01:00')).toBe(180);
  });

  it('mengembalikan 0 jika input kosong', () => {
    expect(calculateOvertimeMinutes('', '20:00')).toBe(0);
    expect(calculateOvertimeMinutes('18:00', '')).toBe(0);
  });

  it('tidak pernah negatif', () => {
    expect(calculateOvertimeMinutes('09:00', '08:00', 5000)).toBe(0);
  });
});

describe('calculateDuration', () => {
  it('konversi menit ke jam', () => {
    expect(calculateDuration('18:00', '20:00')).toBe(2);
    expect(calculateDuration('18:00', '19:30')).toBe(1.5);
  });
});

describe('calculateOvertimePay — formula Indonesia (PP 35/2021)', () => {
  const basicSalary = 4_330_000; // sehingga /173 = 25.028,90...
  const hourlyRate = basicSalary / 173;

  it('hari kerja: jam pertama 1.5x, jam berikutnya 2x', () => {
    const r = calculateOvertimePay(60, 'indonesia', basicSalary, 0, null, false, '5_days');
    expect(r.multiplierTotal).toBeCloseTo(1.5, 10);
    // totalPay dibulatkan ke Rupiah integer (sen tidak ada)
    expect(r.totalPay).toBe(Math.round(hourlyRate * 1.5));
  });

  it('hari kerja 2 jam: jam 1 = 1.5x + jam 2 = 2x → 3.5x total', () => {
    const r = calculateOvertimePay(120, 'indonesia', basicSalary, 0, null, false, '5_days');
    expect(r.multiplierTotal).toBeCloseTo(3.5, 10);
  });

  it('hari libur 5 hari kerja: 8 jam pertama = 2x, jam ke-9 = 3x', () => {
    const r = calculateOvertimePay(9 * 60, 'indonesia', basicSalary, 0, null, true, '5_days');
    expect(r.multiplierTotal).toBeCloseTo(8 * 2 + 3, 10); // 19
  });

  it('hari libur 6 hari kerja: 7 jam pertama = 2x, jam ke-8 = 3x', () => {
    const r = calculateOvertimePay(8 * 60, 'indonesia', basicSalary, 0, null, true, '6_days');
    expect(r.multiplierTotal).toBeCloseTo(7 * 2 + 3, 10); // 17
  });

  it('menambahkan insentif makan + transport', () => {
    const r = calculateOvertimePay(
      60,
      'indonesia',
      basicSalary,
      0,
      null,
      false,
      '5_days',
      15_000,
      10_000,
    );
    expect(r.incentivePay).toBe(25_000);
    // total = pay lembur (dibulatkan) + insentif (sudah integer)
    expect(r.totalPay).toBe(Math.round(hourlyRate * 1.5) + 25_000);
  });

  it('mengembalikan 0 jika gaji pokok kosong', () => {
    const r = calculateOvertimePay(60, 'indonesia', null, 0, null);
    expect(r.totalPay).toBe(0);
    expect(r.hourlyRate).toBe(0);
  });

  it('mengembalikan 0 jika menit <= 0', () => {
    const r = calculateOvertimePay(0, 'indonesia', basicSalary, 0, null);
    expect(r.totalPay).toBe(0);
  });
});

describe('calculateOvertimePay — formula flat rate', () => {
  it('total = jam × tarif flat', () => {
    const r = calculateOvertimePay(120, 'flat_rate', null, 0, 50_000);
    expect(r.totalPay).toBe(100_000);
    expect(r.formulaStr).toContain('2 jam × Tarif Flat');
  });

  it('mengembalikan 0 jika flat rate kosong', () => {
    const r = calculateOvertimePay(120, 'flat_rate', null, 0, null);
    expect(r.totalPay).toBe(0);
  });
});

describe('calculateTotalFixedAllowance / Allowance / Deduction', () => {
  const comps: SalaryComponent[] = [
    { id: '1', name: 'Tunjangan Transport', amount: 500_000, is_fixed: true },
    { id: '2', name: 'Tunjangan Makan', amount: 300_000, is_fixed: true },
    { id: '3', name: 'Bonus', amount: 200_000, is_fixed: false },
  ];

  it('hanya menghitung komponen tetap untuk fixed allowance', () => {
    expect(calculateTotalFixedAllowance(comps)).toBe(800_000);
  });

  it('menghitung semua komponen untuk total allowance', () => {
    expect(calculateTotalAllowance(comps)).toBe(1_000_000);
  });

  it('menghitung total deduction', () => {
    const ded: SalaryComponent[] = [
      { id: '1', name: 'BPJS Kesehatan', amount: 50_000 },
      { id: '2', name: 'BPJS TK', amount: 100_000 },
    ];
    expect(calculateTotalDeduction(ded)).toBe(150_000);
  });

  it('mengembalikan 0 untuk input null', () => {
    expect(calculateTotalFixedAllowance(null)).toBe(0);
    expect(calculateTotalAllowance(null)).toBe(0);
    expect(calculateTotalDeduction(null)).toBe(0);
  });
});
