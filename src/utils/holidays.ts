import { format, parseISO } from 'date-fns';

/**
 * Daftar Hari Libur Nasional & Cuti Bersama Resmi Indonesia (SKB 3 Menteri)
 * Format key: 'yyyy-MM-dd'
 */
export const INDONESIAN_HOLIDAYS: Record<string, string> = {
  // 2024
  '2024-01-01': 'Tahun Baru 2024 Masehi',
  '2024-02-08': 'Isra Mi\'raj Nabi Muhammad SAW',
  '2024-02-09': 'Cuti Bersama Tahun Baru Imlek',
  '2024-02-10': 'Tahun Baru Imlek 2575 Kongzili',
  '2024-03-11': 'Hari Suci Nyepi Tahun Baru Saka 1946',
  '2024-03-12': 'Cuti Bersama Hari Suci Nyepi',
  '2024-03-29': 'Wafat Isa Al Masih',
  '2024-03-31': 'Hari Paskah',
  '2024-04-08': 'Cuti Bersama Idul Fitri 1445 H',
  '2024-04-09': 'Cuti Bersama Idul Fitri 1445 H',
  '2024-04-10': 'Hari Raya Idul Fitri 1445 H',
  '2024-04-11': 'Hari Raya Idul Fitri 1445 H',
  '2024-04-12': 'Cuti Bersama Idul Fitri 1445 H',
  '2024-04-15': 'Cuti Bersama Idul Fitri 1445 H',
  '2024-05-01': 'Hari Buruh Internasional',
  '2024-05-09': 'Kenaikan Isa Al Masih',
  '2024-05-10': 'Cuti Bersama Kenaikan Isa Al Masih',
  '2024-05-23': 'Hari Raya Waisak 2568 BE',
  '2024-05-24': 'Cuti Bersama Hari Raya Waisak',
  '2024-06-01': 'Hari Lahir Pancasila',
  '2024-06-17': 'Hari Raya Idul Adha 1445 H',
  '2024-06-18': 'Cuti Bersama Idul Adha 1445 H',
  '2024-07-07': 'Tahun Baru Islam 1446 H',
  '2024-08-17': 'Hari Kemerdekaan RI ke-79',
  '2024-09-16': 'Maulid Nabi Muhammad SAW',
  '2024-12-25': 'Hari Raya Natal',
  '2024-12-26': 'Cuti Bersama Hari Raya Natal',

  // 2025
  '2025-01-01': 'Tahun Baru 2025 Masehi',
  '2025-01-27': 'Isra Mi\'raj Nabi Muhammad SAW',
  '2025-01-28': 'Cuti Bersama Tahun Baru Imlek',
  '2025-01-29': 'Tahun Baru Imlek 2576 Kongzili',
  '2025-03-29': 'Hari Raya Nyepi Saka 1947',
  '2025-03-31': 'Hari Raya Idul Fitri 1446 H',
  '2025-04-01': 'Hari Raya Idul Fitri 1446 H',
  '2025-04-02': 'Cuti Bersama Idul Fitri 1446 H',
  '2025-04-03': 'Cuti Bersama Idul Fitri 1446 H',
  '2025-04-04': 'Cuti Bersama Idul Fitri 1446 H',
  '2025-04-07': 'Cuti Bersama Idul Fitri 1446 H',
  '2025-04-18': 'Wafat Isa Al Masih',
  '2025-05-01': 'Hari Buruh Internasional',
  '2025-05-12': 'Hari Raya Waisak 2569 BE',
  '2025-05-29': 'Kenaikan Isa Al Masih',
  '2025-06-01': 'Hari Lahir Pancasila',
  '2025-06-06': 'Hari Raya Idul Adha 1446 H',
  '2025-06-27': 'Tahun Baru Islam 1447 H',
  '2025-08-17': 'Hari Kemerdekaan RI ke-80',
  '2025-09-05': 'Maulid Nabi Muhammad SAW',
  '2025-12-25': 'Hari Raya Natal',
  '2025-12-26': 'Cuti Bersama Hari Raya Natal',

  // 2026
  '2026-01-01': 'Tahun Baru 2026 Masehi',
  '2026-01-16': 'Isra Mi\'raj Nabi Muhammad SAW',
  '2026-02-17': 'Tahun Baru Imlek 2577 Kongzili',
  '2026-03-19': 'Hari Raya Nyepi Saka 1948',
  '2026-03-20': 'Hari Raya Idul Fitri 1447 H',
  '2026-03-21': 'Hari Raya Idul Fitri 1447 H',
  '2026-03-23': 'Cuti Bersama Idul Fitri 1447 H',
  '2026-03-24': 'Cuti Bersama Idul Fitri 1447 H',
  '2026-04-03': 'Wafat Isa Al Masih',
  '2026-05-01': 'Hari Buruh Internasional',
  '2026-05-14': 'Kenaikan Isa Al Masih',
  '2026-05-31': 'Hari Raya Waisak 2570 BE',
  '2026-06-01': 'Hari Lahir Pancasila',
  '2026-05-27': 'Hari Raya Idul Adha 1447 H',
  '2026-06-16': 'Tahun Baru Islam 1448 H',
  '2026-08-17': 'Hari Kemerdekaan RI ke-81',
  '2026-08-25': 'Maulid Nabi Muhammad SAW',
  '2026-12-25': 'Hari Raya Natal',
  '2026-12-26': 'Cuti Bersama Hari Raya Natal',
};

/**
 * Memeriksa apakah suatu tanggal merupakan Hari Libur Nasional atau Hari Istirahat Mingguan.
 * @param date Tanggal yang akan diperiksa
 * @param workSystem Sistem kerja: '5_days' (Sabtu & Minggu libur) atau '6_days' (Minggu libur)
 */
export function checkIsHoliday(
  date: Date | string,
  workSystem: '5_days' | '6_days' = '5_days'
): { isHoliday: boolean; holidayName: string | null; isWeekend: boolean } {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const dateKey = format(dateObj, 'yyyy-MM-dd');
  const dayOfWeek = dateObj.getDay(); // 0 = Minggu, 6 = Sabtu

  const nationalHolidayName = INDONESIAN_HOLIDAYS[dateKey] || null;
  const isSunday = dayOfWeek === 0;
  const isSaturday = dayOfWeek === 6;

  const isWeekend = workSystem === '5_days' ? (isSunday || isSaturday) : isSunday;
  const isHoliday = Boolean(nationalHolidayName) || isWeekend;

  let holidayName = nationalHolidayName;
  if (!holidayName) {
    if (isSunday) holidayName = 'Hari Minggu (Libur Mingguan)';
    else if (isSaturday && workSystem === '5_days') holidayName = 'Hari Sabtu (Libur 5 Hari Kerja)';
  }

  return {
    isHoliday,
    holidayName,
    isWeekend,
  };
}
