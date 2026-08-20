import { describe, it, expect } from 'vitest';
import { calculatePph21Ter, getTerCategory } from './tax';

describe('getTerCategory', () => {
  it('TK/0, TK/1, K/0 -> A', () => {
    expect(getTerCategory('TK/0')).toBe('A');
    expect(getTerCategory('TK/1')).toBe('A');
    expect(getTerCategory('K/0')).toBe('A');
  });

  it('TK/2, TK/3, K/1, K/2 -> B', () => {
    expect(getTerCategory('TK/2')).toBe('B');
    expect(getTerCategory('TK/3')).toBe('B');
    expect(getTerCategory('K/1')).toBe('B');
    expect(getTerCategory('K/2')).toBe('B');
  });

  it('K/3 -> C', () => {
    expect(getTerCategory('K/3')).toBe('C');
  });
});

describe('calculatePph21Ter — boundary TER A', () => {
  it('gaji 0 -> pajak 0', () => {
    const r = calculatePph21Ter(0, 'TK/0');
    expect(r.taxAmount).toBe(0);
    expect(r.ratePercentage).toBe(0);
  });

  it('gaji di bawah batas bebas pajak (5.400.000) -> 0%', () => {
    const r = calculatePph21Ter(5_000_000, 'TK/0');
    expect(r.taxAmount).toBe(0);
    expect(r.ratePercentage).toBe(0);
  });

  it('gaji 5.400.000 tepat batas -> masih 0%', () => {
    const r = calculatePph21Ter(5_400_000, 'TK/0');
    expect(r.taxAmount).toBe(0);
  });

  it('gaji 5.650.000 -> rate 0.25%', () => {
    const r = calculatePph21Ter(5_650_000, 'TK/0');
    expect(r.ratePercentage).toBe(0.25);
    expect(r.taxAmount).toBe(Math.round(5_650_000 * 0.0025));
  });

  it('gaji sangat besar (di atas semua bracket) -> rate 34%', () => {
    const r = calculatePph21Ter(10_000_000_000, 'TK/0');
    expect(r.ratePercentage).toBe(34);
    expect(r.taxAmount).toBe(Math.round(10_000_000_000 * 0.34));
  });

  it('default ptkp TK/0', () => {
    const r = calculatePph21Ter(10_000_000);
    expect(r.ptkp).toBe('TK/0');
    expect(r.category).toBe('A');
  });
});

describe('calculatePph21Ter — kategori B & C', () => {
  it('K/1 -> kategori B, gaji 6.200.000 -> 0%', () => {
    const r = calculatePph21Ter(6_200_000, 'K/1');
    expect(r.category).toBe('B');
    expect(r.taxAmount).toBe(0);
  });

  it('K/3 -> kategori C, gaji 6.600.000 -> 0%', () => {
    const r = calculatePph21Ter(6_600_000, 'K/3');
    expect(r.category).toBe('C');
    expect(r.taxAmount).toBe(0);
  });

  it('K/3 gaji 7.350.000 -> rate 0.5%', () => {
    const r = calculatePph21Ter(7_350_000, 'K/3');
    expect(r.ratePercentage).toBe(0.5);
    expect(r.taxAmount).toBe(Math.round(7_350_000 * 0.005));
  });
});

describe('calculatePph21Ter — pembulatan', () => {
  it('hasil selalu integer (tidak ada desimal)', () => {
    for (const gaji of [5_640_000, 8_123_456, 12_345_678, 50_000_000]) {
      const r = calculatePph21Ter(gaji, 'TK/2');
      expect(Number.isInteger(r.taxAmount)).toBe(true);
    }
  });
});
