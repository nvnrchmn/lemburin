import { supabase } from '@/lib/supabase';
import { useDataStore } from '@/stores/data-store';
import { useAuthStore } from '@/stores/auth-store';
import { useToastStore } from '@/stores/toast-store';
import {
  getOrCreatePayPeriodForDate,
  reassignMismatchedEntries,
} from '@/services/pay-period-service';
import type { PayPeriod } from '@/types/database';

const throwSyncError = (
  operation: string,
  error: { message?: string; code?: string; details?: string; hint?: string } | null,
) => {
  if (!error) return;

  const details = [
    error.message,
    error.code ? `code=${error.code}` : null,
    error.details ? `details=${error.details}` : null,
    error.hint ? `hint=${error.hint}` : null,
  ]
    .filter(Boolean)
    .join(' | ');

  throw new Error(`${operation}: ${details || 'Unknown Supabase error'}`);
};

export const syncService = async (specifiedPeriodId?: string) => {
  const { session } = useAuthStore.getState();
  const {
    setProfile,
    setEmployment,
    setActivePayPeriod,
    setOvertimeEntries,
    activePayPeriod,
    setIsSyncing,
    setSyncState,
  } = useDataStore.getState();

  if (!session?.user) {
    setSyncState({ syncStatus: 'idle', syncError: null });
    return;
  }

  setSyncState({ syncStatus: 'syncing', syncError: null });
  setIsSyncing(true);
  try {
    // 0. Fetch Profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle();

    throwSyncError('profiles.select', profileError);

    if (profileData) {
      setProfile(profileData as any);
    }

    // 1. Fetch Employment - pakai user_id eksplisit supaya RLS pass
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
        const { data: pData, error: specifiedPeriodError } = await supabase
          .from('pay_periods')
          .select('*')
          .eq('id', specifiedPeriodId)
          .eq('employment_id', employment.id) // eksplisit filter employment_id
          .maybeSingle();
        throwSyncError('pay_periods.select(specifiedPeriodId)', specifiedPeriodError);
        if (pData) targetPeriod = pData as PayPeriod;
      }

      if (!targetPeriod) {
        const todayStr = new Date().toISOString().split('T')[0];

        // Cari periode yang mencakup hari ini - filter employment_id eksplisit
        const { data: currentPeriods, error: currentPeriodsError } = await supabase
          .from('pay_periods')
          .select('*')
          .eq('employment_id', employment.id)
          .lte('start_date', todayStr)
          .gte('end_date', todayStr)
          .order('start_date', { ascending: true }) // deterministik
          .limit(1);

        throwSyncError('pay_periods.select(current)', currentPeriodsError);

        if (currentPeriods && currentPeriods.length > 0) {
          targetPeriod = currentPeriods[0] as PayPeriod;
        } else {
          // Cari periode terbaru
          const { data: latestPeriods, error: latestPeriodsError } = await supabase
            .from('pay_periods')
            .select('*')
            .eq('employment_id', employment.id)
            .order('start_date', { ascending: false })
            .limit(1);

          throwSyncError('pay_periods.select(latest)', latestPeriodsError);

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
    // Beri tahu user secara jelas (bukan silent) agar tidak melihat data kosong/stale
    const message =
      error instanceof Error && error.message
        ? `Gagal sinkron: ${error.message}`
        : 'Gagal sinkron data. Periksa koneksi internet Anda.';
    setSyncState({ syncStatus: 'error', syncError: message });
    useToastStore.getState().showToast(message, 'error');
  } finally {
    setIsSyncing(false);
    if (useDataStore.getState().syncStatus === 'syncing') {
      setSyncState({ syncStatus: 'synced', lastSyncedAt: new Date().toISOString() });
    }
  }
};
