import { describe, it, expect } from 'vitest';
import { calculateBpjsDeductions, BPJS_JP_CEILING, BPJS_KES_CEILING } from './bpjs';

describe('calculateBpjsDeductions', () => {
  it('gaji 0 -> semua 0', () => {
    const r = calculateBpjsDeductions(0, 0);
    expect(r).toEqual({ jht: 0, jp: 0, kesehatan: 0, totalBpjs: 0 });
  });

  it('tanpa tunjangan: JHT 2%, JP 1%, Kesehatan 1%', () => {
    const r = calculateBpjsDeductions(5_000_000);
    expect(r.jht).toBe(100_000); // 2%
    expect(r.jp).toBe(50_000); // 1%
    expect(r.kesehatan).toBe(50_000); // 1%
    expect(r.totalBpjs).toBe(200_000);
  });

  it('dengan tunjangan: basis = gaji + tunjangan tetap', () => {
    const r = calculateBpjsDeductions(5_000_000, 1_000_000);
    // wageBase = 6.000.000
    expect(r.jht).toBe(120_000);
    expect(r.jp).toBe(60_000);
    expect(r.kesehatan).toBe(60_000);
    expect(r.totalBpjs).toBe(240_000);
  });

  it('JP pakai ceiling 10.042.300', () => {
    const r = calculateBpjsDeductions(BPJS_JP_CEILING + 5_000_000);
    // JP dihitung dari ceiling, bukan gaji penuh
    expect(r.jp).toBe(Math.round(BPJS_JP_CEILING * 0.01));
    expect(r.jp).toBeLessThan(Math.round((BPJS_JP_CEILING + 5_000_000) * 0.01));
  });

  it('Kesehatan pakai ceiling 12.000.000', () => {
    const r = calculateBpjsDeductions(BPJS_KES_CEILING + 3_000_000);
    expect(r.kesehatan).toBe(Math.round(BPJS_KES_CEILING * 0.01));
    expect(r.kesehatan).toBeLessThan(Math.round((BPJS_KES_CEILING + 3_000_000) * 0.01));
  });

  it('hasBpjsTk=false -> JHT & JP = 0, kesehatan tetap jalan', () => {
    const r = calculateBpjsDeductions(5_000_000, 0, false, true);
    expect(r.jht).toBe(0);
    expect(r.jp).toBe(0);
    expect(r.kesehatan).toBe(50_000);
  });

  it('hasBpjsKes=false -> kesehatan = 0', () => {
    const r = calculateBpjsDeductions(5_000_000, 0, true, false);
    expect(r.kesehatan).toBe(0);
    expect(r.jht).toBe(100_000);
    expect(r.jp).toBe(50_000);
  });

  it('total = jht + jp + kesehatan', () => {
    const r = calculateBpjsDeductions(8_000_000, 2_000_000);
    expect(r.totalBpjs).toBe(r.jht + r.jp + r.kesehatan);
  });

  it('hasil selalu integer', () => {
    const r = calculateBpjsDeductions(4_330_000, 1_234_567);
    expect(Number.isInteger(r.jht)).toBe(true);
    expect(Number.isInteger(r.jp)).toBe(true);
    expect(Number.isInteger(r.kesehatan)).toBe(true);
    expect(Number.isInteger(r.totalBpjs)).toBe(true);
  });
});
