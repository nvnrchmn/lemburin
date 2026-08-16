import { supabase } from '@/lib/supabase';
import { useDataStore } from '@/stores/data-store';
import { useAuthStore } from '@/stores/auth-store';
import { getOrCreatePayPeriodForDate, reassignMismatchedEntries } from '@/services/pay-period-service';
import type { PayPeriod } from '@/types/database';

export const syncService = async (specifiedPeriodId?: string) => {
  const { session } = useAuthStore.getState();
  const { setProfile, setEmployment, setActivePayPeriod, setOvertimeEntries, activePayPeriod } = useDataStore.getState();

  if (!session?.user) return;

  try {
    // 0. Fetch Profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (profileData) {
      setProfile(profileData as any);
    }

    // 1. Fetch Employment
    const { data: employments, error: empError } = await supabase
      .from('employments')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (empError) throw empError;

    if (employments && (employments as any[]).length > 0) {
      const employment = (employments as any[])[0];
      setEmployment(employment);

      // Jalankan pembersihan & penataan ulang entri lembur ke periode yang benar (self-healing)
      await reassignMismatchedEntries(employment.id, activePayPeriod);

      let targetPeriod: PayPeriod | null = null;

      if (specifiedPeriodId) {
        const { data: pData } = await supabase
          .from('pay_periods')
          .select('*')
          .eq('id', specifiedPeriodId)
          .maybeSingle();
        if (pData) targetPeriod = pData as PayPeriod;
      }

      if (!targetPeriod) {
        const todayStr = new Date().toISOString().split('T')[0];
        
        // Cari periode yang mencakup hari ini
        const { data: currentPeriods } = await supabase
          .from('pay_periods')
          .select('*')
          .eq('employment_id', employment.id)
          .lte('start_date', todayStr)
          .gte('end_date', todayStr)
          .limit(1);

        if (currentPeriods && currentPeriods.length > 0) {
          targetPeriod = currentPeriods[0] as PayPeriod;
        } else {
          // Cari periode terbaru
          const { data: latestPeriods } = await supabase
            .from('pay_periods')
            .select('*')
            .eq('employment_id', employment.id)
            .order('start_date', { ascending: false })
            .limit(1);

          if (latestPeriods && latestPeriods.length > 0) {
            targetPeriod = latestPeriods[0] as PayPeriod;
          } else {
            // Jika belum ada sama sekali, otomatis buat untuk hari ini
            targetPeriod = await getOrCreatePayPeriodForDate(employment.id, todayStr);
          }
        }
      }

      if (targetPeriod) {
        setActivePayPeriod(targetPeriod);

        // 3. Fetch Overtime Entries KHUSUS untuk periode ini saja
        const { data: entries, error: entriesError } = await supabase
          .from('overtime_entries')
          .select('*')
          .eq('pay_period_id', targetPeriod.id)
          .order('work_date', { ascending: true });

        if (entriesError) throw entriesError;
        setOvertimeEntries((entries as any[]) || []);
      }
    }
  } catch (error) {
    console.error('Failed to sync data from Supabase:', error);
  }
};
