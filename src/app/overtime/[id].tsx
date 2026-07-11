import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { format, differenceInMinutes, parse } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

import { useDataStore } from '@/stores/data-store';
import { supabase } from '@/lib/supabase';
import { calculateOvertimePay } from '@/utils/calculator';
import { useToastStore } from '@/stores/toast-store';

export default function OvertimeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { overtimeEntries, removeOvertimeEntry, activePayPeriod, employment } = useDataStore();
  const { showToast } = useToastStore();
  const [isDeleting, setIsDeleting] = useState(false);

  const entry = overtimeEntries.find(e => e.id === id);

  if (!entry) {
    return (
      <View className="flex-1 bg-dark-bg justify-center items-center">
        <Text className="text-white">Data lembur tidak ditemukan</Text>
      </View>
    );
  }

  // Calculate duration
  const start = parse(entry.start_time, 'HH:mm:ss', new Date());
  const end = parse(entry.end_time, 'HH:mm:ss', new Date());
  let diffMins = differenceInMinutes(end, start);
  
  if (diffMins < 0) diffMins += 24 * 60; // Crosses midnight
  
  diffMins -= entry.break_minutes; // subtract break
  const durationHours = (diffMins / 60).toFixed(1);

  // Calculate estimation
  let estimatedWage = 0;
  let formulaName = 'Formula Indonesia';
  
  if (activePayPeriod && employment) {
    if (activePayPeriod.formula_type === 'indonesia') {
      formulaName = 'Formula Kemenaker';
      const calcResult = calculateOvertimePay(
        diffMins,
        'indonesia',
        employment.basic_salary || 0,
        employment.allowances_detail?.filter(a => a.is_fixed).reduce((sum, a) => sum + a.amount, 0) || 0,
        null,
        false
      );
      estimatedWage = calcResult.totalPay;
    } else if (activePayPeriod.formula_type === 'flat_rate' && activePayPeriod.flat_rate_amount) {
      formulaName = 'Tarif Tetap (Flat Rate)';
      estimatedWage = (diffMins / 60) * activePayPeriod.flat_rate_amount;
    }
  }

  const handleDelete = () => {
    Alert.alert(
      'Hapus Data',
      'Apakah Anda yakin ingin menghapus data lembur ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const { error } = await supabase
                .from('overtime_entries')
                .delete()
                .eq('id', entry.id);

              if (error) throw error;

              removeOvertimeEntry(entry.id);
              showToast('Data berhasil dihapus', 'success');
              router.back();
            } catch (error: any) {
              showToast(error.message || 'Gagal menghapus', 'error');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    router.push(`/overtime/edit/${entry.id}` as any);
  };

  return (
    <ScrollView className="flex-1 bg-dark-bg">
      <View className="px-5 pt-6">
        {/* Date Header */}
        <View className="bg-primary-950 border border-primary-800 rounded-2xl p-5 mb-4">
          <Text className="text-primary-300 text-xs font-medium mb-1">
            TANGGAL LEMBUR
          </Text>
          <Text className="text-dark-text text-xl font-bold">
            {format(new Date(entry.work_date), 'EEEE, d MMMM yyyy', { locale: localeId })}
          </Text>
        </View>

        {/* Time Info */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-dark-card border border-dark-border rounded-xl p-4">
            <Text className="text-dark-muted text-xs">Jam Mulai</Text>
            <Text className="text-dark-text text-lg font-bold mt-1">
              {entry.start_time.substring(0, 5)}
            </Text>
          </View>
          <View className="flex-1 bg-dark-card border border-dark-border rounded-xl p-4">
            <Text className="text-dark-muted text-xs">Jam Selesai</Text>
            <Text className="text-dark-text text-lg font-bold mt-1">
              {entry.end_time.substring(0, 5)}
            </Text>
          </View>
        </View>

        {/* Duration & Break */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-dark-card border border-dark-border rounded-xl p-4">
            <Text className="text-dark-muted text-xs">Durasi Bersih</Text>
            <Text className="text-dark-text text-lg font-bold mt-1">{durationHours} jam</Text>
          </View>
          <View className="flex-1 bg-dark-card border border-dark-border rounded-xl p-4">
            <Text className="text-dark-muted text-xs">Istirahat</Text>
            <Text className="text-dark-text text-lg font-bold mt-1">{entry.break_minutes} mnt</Text>
          </View>
        </View>

        {/* Estimation */}
        <View className="bg-dark-card border border-dark-border rounded-xl p-4 mb-4">
          <Text className="text-dark-muted text-xs">Estimasi Upah</Text>
          <Text className="text-secondary-400 text-2xl font-bold mt-1">
            Rp {estimatedWage.toLocaleString('id-ID')}
          </Text>
          <Text className="text-dark-muted text-xs mt-1">
            {formulaName}
          </Text>
        </View>

        {/* Notes */}
        {entry.notes && (
          <View className="bg-dark-card border border-dark-border rounded-xl p-4 mb-6">
            <Text className="text-dark-muted text-xs mb-1">Catatan</Text>
            <Text className="text-dark-text text-sm">
              {entry.notes}
            </Text>
          </View>
        )}

        {/* Actions */}
        <View className="flex-row gap-3 mb-8">
          <Pressable 
            onPress={handleEdit}
            disabled={isDeleting}
            className="flex-1 bg-primary-600 rounded-xl py-3.5 items-center active:bg-primary-700"
          >
            <Text className="text-white font-semibold">Edit</Text>
          </Pressable>
          <Pressable 
            onPress={handleDelete}
            disabled={isDeleting}
            className={`flex-1 bg-dark-card border border-red-500/30 rounded-xl py-3.5 items-center flex-row justify-center gap-2 active:opacity-70 ${isDeleting ? 'opacity-50' : ''}`}
          >
            {isDeleting && <ActivityIndicator size="small" color="#ef4444" />}
            <Text className="text-red-400 font-semibold">Hapus</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
