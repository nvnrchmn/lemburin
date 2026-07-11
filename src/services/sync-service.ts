import { supabase } from '@/lib/supabase';
import { useDataStore } from '@/stores/data-store';
import { useAuthStore } from '@/stores/auth-store';

export const syncService = async () => {
  const { session } = useAuthStore.getState();
  const { setEmployment, setActivePayPeriod, setOvertimeEntries } = useDataStore.getState();

  if (!session?.user) return;

  try {
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

      // 2. Fetch Latest Pay Period for this employment
      const { data: payPeriods, error: ppError } = await supabase
        .from('pay_periods')
        .select('*')
        .eq('employment_id', employment.id)
        .order('start_date', { ascending: false })
        .limit(1);

      if (ppError) throw ppError;

      if (payPeriods && (payPeriods as any[]).length > 0) {
        const activePeriod = (payPeriods as any[])[0];
        setActivePayPeriod(activePeriod);

        // 3. Fetch Overtime Entries for this period
        const { data: entries, error: entriesError } = await supabase
          .from('overtime_entries')
          .select('*')
          .eq('pay_period_id', activePeriod.id)
          .order('work_date', { ascending: true });

        if (entriesError) throw entriesError;
        if (entries) setOvertimeEntries(entries as any[]);
      }
    }
  } catch (error) {
    console.error('Failed to sync data from Supabase:', error);
  }
};
