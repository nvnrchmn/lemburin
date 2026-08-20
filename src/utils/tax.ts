/**
 * Modul Perhitungan Pajak Penghasilan PPh 21 Skema TER 2024
 * Berdasarkan PP No. 58 Tahun 2023 & PMK No. 168 Tahun 2023
 */

import { roundCurrency } from './formatting';

export type PtkpStatus = 'TK/0' | 'TK/1' | 'TK/2' | 'TK/3' | 'K/0' | 'K/1' | 'K/2' | 'K/3';
export type TerCategory = 'A' | 'B' | 'C';

export function getTerCategory(ptkp: PtkpStatus): TerCategory {
  switch (ptkp) {
    case 'TK/0':
    case 'TK/1':
    case 'K/0':
      return 'A';
    case 'TK/2':
    case 'TK/3':
    case 'K/1':
    case 'K/2':
      return 'B';
    case 'K/3':
      return 'C';
    default:
      return 'A';
  }
}

interface TerBracket {
  maxIncome: number;
  rate: number;
}

const TER_A_BRACKETS: TerBracket[] = [
  { maxIncome: 5400000, rate: 0.0 },
  { maxIncome: 5650000, rate: 0.0025 },
  { maxIncome: 5950000, rate: 0.005 },
  { maxIncome: 6300000, rate: 0.0075 },
  { maxIncome: 6750000, rate: 0.01 },
  { maxIncome: 7500000, rate: 0.0125 },
  { maxIncome: 8550000, rate: 0.015 },
  { maxIncome: 9650000, rate: 0.0175 },
  { maxIncome: 10050000, rate: 0.02 },
  { maxIncome: 10350000, rate: 0.0225 },
  { maxIncome: 10700000, rate: 0.025 },
  { maxIncome: 11050000, rate: 0.03 },
  { maxIncome: 11600000, rate: 0.035 },
  { maxIncome: 12500000, rate: 0.04 },
  { maxIncome: 13750000, rate: 0.05 },
  { maxIncome: 15100000, rate: 0.06 },
  { maxIncome: 16950000, rate: 0.07 },
  { maxIncome: 19750000, rate: 0.08 },
  { maxIncome: 24150000, rate: 0.09 },
  { maxIncome: 26450000, rate: 0.1 },
  { maxIncome: 28000000, rate: 0.11 },
  { maxIncome: 30050000, rate: 0.12 },
  { maxIncome: 32400000, rate: 0.13 },
  { maxIncome: 35400000, rate: 0.14 },
  { maxIncome: 39100000, rate: 0.15 },
  { maxIncome: 43850000, rate: 0.16 },
  { maxIncome: 47800000, rate: 0.17 },
  { maxIncome: 51400000, rate: 0.18 },
  { maxIncome: 56300000, rate: 0.19 },
  { maxIncome: 62200000, rate: 0.2 },
  { maxIncome: 68600000, rate: 0.21 },
  { maxIncome: 77500000, rate: 0.22 },
  { maxIncome: 89000000, rate: 0.23 },
  { maxIncome: 103000000, rate: 0.24 },
  { maxIncome: 125000000, rate: 0.25 },
  { maxIncome: 157000000, rate: 0.26 },
  { maxIncome: 206000000, rate: 0.27 },
  { maxIncome: 337000000, rate: 0.28 },
  { maxIncome: 454000000, rate: 0.29 },
  { maxIncome: 550000000, rate: 0.3 },
  { maxIncome: 695000000, rate: 0.31 },
  { maxIncome: 910000000, rate: 0.32 },
  { maxIncome: 1400000000, rate: 0.33 },
  { maxIncome: Infinity, rate: 0.34 },
];

const TER_B_BRACKETS: TerBracket[] = [
  { maxIncome: 6200000, rate: 0.0 },
  { maxIncome: 6500000, rate: 0.0025 },
  { maxIncome: 6850000, rate: 0.005 },
  { maxIncome: 7300000, rate: 0.0075 },
  { maxIncome: 9200000, rate: 0.01 },
  { maxIncome: 10750000, rate: 0.015 },
  { maxIncome: 11250000, rate: 0.02 },
  { maxIncome: 11600000, rate: 0.025 },
  { maxIncome: 12600000, rate: 0.03 },
  { maxIncome: 13600000, rate: 0.04 },
  { maxIncome: 14950000, rate: 0.05 },
  { maxIncome: 16400000, rate: 0.06 },
  { maxIncome: 18450000, rate: 0.07 },
  { maxIncome: 21850000, rate: 0.08 },
  { maxIncome: 26000000, rate: 0.09 },
  { maxIncome: 27700000, rate: 0.1 },
  { maxIncome: 29350000, rate: 0.11 },
  { maxIncome: 31450000, rate: 0.12 },
  { maxIncome: 33950000, rate: 0.13 },
  { maxIncome: 37100000, rate: 0.14 },
  { maxIncome: 41100000, rate: 0.15 },
  { maxIncome: 45800000, rate: 0.16 },
  { maxIncome: 49500000, rate: 0.17 },
  { maxIncome: 53800000, rate: 0.18 },
  { maxIncome: 58500000, rate: 0.19 },
  { maxIncome: 64000000, rate: 0.2 },
  { maxIncome: 71000000, rate: 0.21 },
  { maxIncome: 80000000, rate: 0.22 },
  { maxIncome: 93000000, rate: 0.23 },
  { maxIncome: 109000000, rate: 0.24 },
  { maxIncome: 129000000, rate: 0.25 },
  { maxIncome: 163000000, rate: 0.26 },
  { maxIncome: 211000000, rate: 0.27 },
  { maxIncome: 374000000, rate: 0.28 },
  { maxIncome: 459000000, rate: 0.29 },
  { maxIncome: 555000000, rate: 0.3 },
  { maxIncome: 704000000, rate: 0.31 },
  { maxIncome: 957000000, rate: 0.32 },
  { maxIncome: 1405000000, rate: 0.33 },
  { maxIncome: Infinity, rate: 0.34 },
];

const TER_C_BRACKETS: TerBracket[] = [
  { maxIncome: 6600000, rate: 0.0 },
  { maxIncome: 6950000, rate: 0.0025 },
  { maxIncome: 7350000, rate: 0.005 },
  { maxIncome: 7800000, rate: 0.0075 },
  { maxIncome: 8850000, rate: 0.01 },
  { maxIncome: 9800000, rate: 0.0125 },
  { maxIncome: 10950000, rate: 0.015 },
  { maxIncome: 11200000, rate: 0.0175 },
  { maxIncome: 12050000, rate: 0.02 },
  { maxIncome: 12950000, rate: 0.03 },
  { maxIncome: 14150000, rate: 0.04 },
  { maxIncome: 15550000, rate: 0.05 },
  { maxIncome: 17050000, rate: 0.06 },
  { maxIncome: 19500000, rate: 0.07 },
  { maxIncome: 22700000, rate: 0.08 },
  { maxIncome: 26600000, rate: 0.09 },
  { maxIncome: 28100000, rate: 0.1 },
  { maxIncome: 30100000, rate: 0.11 },
  { maxIncome: 32600000, rate: 0.12 },
  { maxIncome: 35400000, rate: 0.13 },
  { maxIncome: 38900000, rate: 0.14 },
  { maxIncome: 43000000, rate: 0.15 },
  { maxIncome: 47400000, rate: 0.16 },
  { maxIncome: 51200000, rate: 0.17 },
  { maxIncome: 55800000, rate: 0.18 },
  { maxIncome: 60400000, rate: 0.19 },
  { maxIncome: 66700000, rate: 0.2 },
  { maxIncome: 74500000, rate: 0.21 },
  { maxIncome: 83200000, rate: 0.22 },
  { maxIncome: 95600000, rate: 0.23 },
  { maxIncome: 110000000, rate: 0.24 },
  { maxIncome: 134000000, rate: 0.25 },
  { maxIncome: 169000000, rate: 0.26 },
  { maxIncome: 221000000, rate: 0.27 },
  { maxIncome: 390000000, rate: 0.28 },
  { maxIncome: 463000000, rate: 0.29 },
  { maxIncome: 561000000, rate: 0.3 },
  { maxIncome: 709000000, rate: 0.31 },
  { maxIncome: 965000000, rate: 0.32 },
  { maxIncome: 1419000000, rate: 0.33 },
  { maxIncome: Infinity, rate: 0.34 },
];

/**
 * Menghitung Pajak Penghasilan PPh 21 Bulanan dengan skema TER
 * @param grossIncome Penghasilan bruto bulanan (Gaji Pokok + Tunjangan Tetap + Lembur + Insentif)
 * @param ptkp Status PTKP karyawan ('TK/0', 'K/1', dll.)
 */
export function calculatePph21Ter(grossIncome: number, ptkp: PtkpStatus = 'TK/0') {
  if (grossIncome <= 0) {
    return {
      taxAmount: 0,
      ratePercentage: 0,
      category: getTerCategory(ptkp),
      ptkp,
    };
  }

  const category = getTerCategory(ptkp);
  const brackets =
    category === 'A' ? TER_A_BRACKETS : category === 'B' ? TER_B_BRACKETS : TER_C_BRACKETS;

  let effectiveRate = 0;
  for (const b of brackets) {
    if (grossIncome <= b.maxIncome) {
      effectiveRate = b.rate;
      break;
    }
  }

  const taxAmount = roundCurrency(grossIncome * effectiveRate);

  return {
    taxAmount,
    ratePercentage: effectiveRate * 100,
    category,
    ptkp,
  };
}
