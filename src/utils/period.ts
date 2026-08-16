import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export interface CalculatedPeriodDates {
  startDate: string; // yyyy-MM-dd
  endDate: string;   // yyyy-MM-dd
  periodName: string; // e.g. "Agustus 2026"
}

/**
 * Menghitung rentang tanggal periode gaji berdasarkan tanggal acuan (targetDate) dan tanggal cut-off (startDay).
 * Contoh startDay = 1 (1 s/d Akhir Bulan):
 * - Target 15 Juli 2026 -> 1 Juli 2026 s/d 31 Juli 2026 (Periode Juli 2026)
 * - Target 5 Agustus 2026 -> 1 Agustus 2026 s/d 31 Agustus 2026 (Periode Agustus 2026)
 *
 * Contoh startDay = 21 (21 s/d 20 bulan berikutnya):
 * - Target 15 Juli 2026 -> 21 Juni 2026 s/d 20 Juli 2026 (Periode Juli 2026)
 * - Target 25 Juli 2026 -> 21 Juli 2026 s/d 20 Agustus 2026 (Periode Agustus 2026)
 */
export function calculatePeriodDatesForTargetDate(targetDate: Date | string, startDay: number = 1): CalculatedPeriodDates {
  const dateObj = typeof targetDate === 'string' ? parseISO(targetDate) : targetDate;
  
  const day = dateObj.getDate();
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth(); // 0 - 11

  let startYear = year;
  let startMonth = month;
  let endYear = year;
  let endMonth = month;

  if (startDay === 1) {
    // 1st of this month to last day of this month
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0); // last day of current month
    const periodName = format(startDate, 'MMMM yyyy', { locale: localeId });

    return {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      periodName: periodName.charAt(0).toUpperCase() + periodName.slice(1),
    };
  }

  if (day < startDay) {
    // Tanggal sebelum cut-off: masuk ke siklus (Bulan-1, startDay) s/d (Bulan, startDay - 1)
    startMonth = month - 1;
    if (startMonth < 0) {
      startMonth = 11;
      startYear = year - 1;
    }
  } else {
    // Tanggal setelah/sama dengan cut-off: masuk ke siklus (Bulan, startDay) s/d (Bulan+1, startDay - 1)
    endMonth = month + 1;
    if (endMonth > 11) {
      endMonth = 0;
      endYear = year + 1;
    }
  }

  const startDate = new Date(startYear, startMonth, startDay);
  const endDate = new Date(endYear, endMonth, startDay - 1);
  const periodName = format(endDate, 'MMMM yyyy', { locale: localeId });

  return {
    startDate: format(startDate, 'yyyy-MM-dd'),
    endDate: format(endDate, 'yyyy-MM-dd'),
    periodName: periodName.charAt(0).toUpperCase() + periodName.slice(1),
  };
}
