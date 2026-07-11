/**
 * Lemburin App Configuration
 */

export const APP_CONFIG = {
  name: 'Lemburin',
  tagline: 'Catat. Hitung. Verifikasi.',
  version: '1.0.0',
  defaultTimezone: 'Asia/Jakarta',
  defaultLanguage: 'id',
  defaultCurrency: 'IDR',
} as const;

export const PAY_PERIOD_PRESETS = [
  { label: '1 - 31 (Akhir Bulan)', startDay: 1 },
  { label: '21 - 20', startDay: 21 },
  { label: '26 - 25', startDay: 26 },
] as const;

export const FORMULA_TYPES = {
  indonesia: {
    id: 'indonesia',
    label: 'Formula Indonesia',
    description: 'Perhitungan sesuai UU Ketenagakerjaan Indonesia',
  },
  flat_rate: {
    id: 'flat_rate',
    label: 'Flat Rate',
    description: 'Tarif tetap per jam lembur',
  },
  custom: {
    id: 'custom',
    label: 'Custom Formula',
    description: 'Formula pribadi sesuai kebijakan perusahaan',
  },
} as const;
