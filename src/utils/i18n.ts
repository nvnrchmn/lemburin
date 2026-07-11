type Translations = {
  [key: string]: {
    id: string;
    en: string;
  };
};

export const translations: Translations = {
  // Dashboard
  welcome: { id: 'Selamat datang', en: 'Welcome' },
  hi: { id: 'Hai', en: 'Hi' },
  activePeriod: { id: 'PERIODE AKTIF', en: 'ACTIVE PERIOD' },
  noPeriod: { id: 'Belum Ada Periode', en: 'No Active Period' },
  setPeriod: { id: 'Atur Periode', en: 'Set Period' },
  overtimeDays: { id: 'Hari Lembur', en: 'Overtime Days' },
  totalHours: { id: 'Total Jam', en: 'Total Hours' },
  estimatedPay: { id: 'Estimasi Upah Lembur', en: 'Estimated Overtime Pay' },
  verificationStatus: { id: 'Status Verifikasi Slip', en: 'Slip Verification Status' },
  unverified: { id: 'Belum Diverifikasi', en: 'Unverified' },
  verify: { id: 'Verifikasi →', en: 'Verify →' },
  recentOvertime: { id: 'Lembur Terakhir', en: 'Recent Overtime' },
  seeAll: { id: 'Lihat Semua', en: 'See All' },
  noRecentOvertime: { id: 'Belum ada catatan lembur bulan ini', en: 'No overtime records this month' },
  addFirstOvertime: { id: '+ Catat Lembur Pertama', en: '+ Add First Overtime' },

  // Settings
  settings: { id: 'Pengaturan', en: 'Settings' },
  companySettings: { id: 'Perusahaan & Gaji', en: 'Company & Salary' },
  companyProfile: { id: 'Profil Perusahaan', en: 'Company Profile' },
  payPeriod: { id: 'Periode Gaji', en: 'Pay Period' },
  formula: { id: 'Formula Perhitungan', en: 'Calculation Formula' },
  appPreferences: { id: 'Preferensi Aplikasi', en: 'App Preferences' },
  language: { id: 'Bahasa', en: 'Language' },
  currency: { id: 'Mata Uang', en: 'Currency' },
  theme: { id: 'Tampilan Tema', en: 'Theme Appearance' },
  dark: { id: 'Gelap', en: 'Dark' },
  signOut: { id: 'Keluar (Sign Out)', en: 'Sign Out' },
};

export function t(key: string, language: string = 'id'): string {
  if (!translations[key]) return key;
  return translations[key][language as 'id' | 'en'] || translations[key].id;
}
