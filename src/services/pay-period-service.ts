import { supabase } from '@/lib/supabase';
import type { PayPeriod, OvertimeEntry } from '@/types/database';
import { calculatePeriodDatesForTargetDate } from '@/utils/period';
import { parseISO } from 'date-fns';

/**
 * Mencari atau secara otomatis membuat Pay Period yang sesuai dengan tanggal kerja (workDate).
 */
export async function getOrCreatePayPeriodForDate(
  employmentId: string,
  workDate: Date | string,
  fallbackPeriod?: PayPeriod | null,
): Promise<PayPeriod> {
  const dateStr =
    typeof workDate === 'string' ? workDate.split('T')[0] : workDate.toISOString().split('T')[0];

  // 1. Cek apakah sudah ada periode yang mencakup tanggal ini
  //    (diurutkan agar deterministik saat ada banyak hasil)
  const { data: existingPeriods, error: searchError } = await supabase
    .from('pay_periods')
    .select('*')
    .eq('employment_id', employmentId)
    .lte('start_date', dateStr)
    .gte('end_date', dateStr)
    .order('start_date', { ascending: true })
    .limit(1);

  if (!searchError && existingPeriods && existingPeriods.length > 0) {
    return existingPeriods[0] as PayPeriod;
  }

  // 2. Hitung tanggal periode yang sesuai dengan preferensi cut-off user
  let startDay = 1;
  if (fallbackPeriod?.start_date) {
    try {
      startDay = parseISO(fallbackPeriod.start_date).getDate();
    } catch {
      startDay = 1;
    }
  }

  const calculated = calculatePeriodDatesForTargetDate(dateStr, startDay);
  const formulaType = fallbackPeriod?.formula_type || 'indonesia';
  const flatRate = fallbackPeriod?.flat_rate_amount || null;

  // Cek sekali lagi apakah periode dengan rentang ini sudah ada di database
  const { data: exactMatch } = await supabase
    .from('pay_periods')
    .select('*')
    .eq('employment_id', employmentId)
    .eq('start_date', calculated.startDate)
    .eq('end_date', calculated.endDate)
    .maybeSingle();

  if (exactMatch) {
    return exactMatch as PayPeriod;
  }

  // 3. Buat Pay Period baru untuk bulan/rentang tersebut
  const newPeriodPayload = {
    employment_id: employmentId,
    period_name: calculated.periodName,
    start_date: calculated.startDate,
    end_date: calculated.endDate,
    formula_type: formulaType,
    flat_rate_amount: flatRate,
    is_locked: false,
  };

  const { data: createdPeriod, error: insertError } = await supabase
    .from('pay_periods')
    .insert(newPeriodPayload as any)
    .select()
    .single();

  if (insertError) {
    // DB constraint (uq_pay_periods_employment_range / chk_pay_periods_no_overlap)
    // menolak duplikat/overlap — ini biasanya karena race condition: request lain
    // sudah membuat periode yang sama di antara cek dan insert kita.
    // Solusi: ambil periode yang sudah ada (jika cocok) alih-alih gagal.
    console.warn(
      'Pay period insert rejected (likely race/duplicate), refetching:',
      insertError.message,
    );

    const { data: racedPeriod } = await supabase
      .from('pay_periods')
      .select('*')
      .eq('employment_id', employmentId)
      .eq('start_date', calculated.startDate)
      .eq('end_date', calculated.endDate)
      .maybeSingle();

    if (racedPeriod) {
      return racedPeriod as PayPeriod;
    }

    // Bukan duplikat — error asli
    throw insertError;
  }

  return createdPeriod as PayPeriod;
}

/**
 * Otomatis memperbaiki dan memisahkan entri lembur yang tercatat di pay_period_id yang salah.
 * (Contoh: lembur Juli yang sempat tersimpan di pay_period Agustus akan dipindahkan ke pay_period Juli).
 */
export async function reassignMismatchedEntries(
  employmentId: string,
  fallbackPeriod?: PayPeriod | null,
): Promise<void> {
  try {
    // Ambil semua periode milik employment ini
    const { data: periods } = await supabase
      .from('pay_periods')
      .select('*')
      .eq('employment_id', employmentId);

    if (!periods || periods.length === 0) return;

    const periodMap = new Map<string, PayPeriod>();
    periods.forEach(p => periodMap.set(p.id, p as PayPeriod));

    const periodIds = periods.map(p => p.id);

    // Ambil semua entri lembur
    const { data: entries } = await supabase
      .from('overtime_entries')
      .select('*')
      .in('pay_period_id', periodIds);

    if (!entries || entries.length === 0) return;

    for (const entry of entries as OvertimeEntry[]) {
      const assignedPeriod = periodMap.get(entry.pay_period_id);
      const isMismatched =
        !assignedPeriod ||
        entry.work_date < assignedPeriod.start_date ||
        entry.work_date > assignedPeriod.end_date;

      if (isMismatched) {
        // Cari atau buatkan periode yang tepat untuk work_date entri ini
        const correctPeriod = await getOrCreatePayPeriodForDate(
          employmentId,
          entry.work_date,
          fallbackPeriod || assignedPeriod,
        );
        if (correctPeriod && correctPeriod.id !== entry.pay_period_id) {
          await supabase
            .from('overtime_entries')
            .update({ pay_period_id: correctPeriod.id })
            .eq('id', entry.id);
        }
      }
    }
  } catch (err) {
    console.error('Error during reassignMismatchedEntries:', err);
  }
}
