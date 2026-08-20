import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { format, differenceInMinutes, parse } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';

import { useDataStore } from '@/stores/data-store';
import { supabase } from '@/lib/supabase';
import { calculateOvertimePay } from '@/utils/calculator';
import { useToastStore } from '@/stores/toast-store';

export default function OvertimeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { overtimeEntries, removeOvertimeEntry, activePayPeriod, employment } = useDataStore();
  const { showToast } = useToastStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);

  const entry = overtimeEntries.find(e => e.id === id);

  if (!entry) {
    return (
      <View className="flex-1 bg-light-bg dark:bg-dark-bg justify-center items-center">
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
        employment.allowances_detail
          ?.filter(a => a.is_fixed)
          .reduce((sum, a) => sum + a.amount, 0) || 0,
        null,
        entry.is_holiday ?? false,
        employment.work_system || '5_days',
        employment.overtime_meal_allowance || 0,
        employment.overtime_transport_allowance || 0,
      );
      estimatedWage = calcResult.totalPay;
    } else if (activePayPeriod.formula_type === 'flat_rate' && activePayPeriod.flat_rate_amount) {
      formulaName = 'Tarif Tetap (Flat Rate)';
      const calcResult = calculateOvertimePay(
        diffMins,
        'flat_rate',
        null,
        0,
        activePayPeriod.flat_rate_amount,
        entry.is_holiday ?? false,
        employment.work_system || '5_days',
        employment.overtime_meal_allowance || 0,
        employment.overtime_transport_allowance || 0,
      );
      estimatedWage = calcResult.totalPay;
    }
  }

  const handleDelete = () => {
    Alert.alert('Hapus Data', 'Apakah Anda yakin ingin menghapus data lembur ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          setIsDeleting(true);
          try {
            const { error } = await supabase.from('overtime_entries').delete().eq('id', entry.id);

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
    ]);
  };

  const handleEdit = () => {
    router.push(`/overtime/edit/${entry.id}` as any);
  };

  return (
    <ScrollView className="flex-1 bg-light-bg dark:bg-dark-bg">
      <View className="px-5 pt-6">
        {/* Date Header */}
        <View className="bg-primary-950 border border-primary-800 rounded-2xl p-5 mb-4">
          <View className="flex-row justify-between items-start mb-1">
            <Text className="text-primary-300 text-xs font-medium">TANGGAL LEMBUR</Text>
            {entry.is_holiday && (
              <View className="bg-red-500/20 border border-red-500/30 px-2.5 py-0.5 rounded-full">
                <Text className="text-red-400 text-[10px] font-bold uppercase tracking-wider">
                  Hari Libur
                </Text>
              </View>
            )}
          </View>
          <Text className="text-light-text dark:text-dark-text text-xl font-bold">
            {format(new Date(entry.work_date), 'EEEE, d MMMM yyyy', { locale: localeId })}
          </Text>
        </View>

        {/* Time Info */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-4">
            <Text className="text-light-muted dark:text-dark-muted text-xs">Jam Mulai</Text>
            <Text className="text-light-text dark:text-dark-text text-lg font-bold mt-1">
              {entry.start_time.substring(0, 5)}
            </Text>
          </View>
          <View className="flex-1 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-4">
            <Text className="text-light-muted dark:text-dark-muted text-xs">Jam Selesai</Text>
            <Text className="text-light-text dark:text-dark-text text-lg font-bold mt-1">
              {entry.end_time.substring(0, 5)}
            </Text>
          </View>
        </View>

        {/* Duration & Break */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-4">
            <Text className="text-light-muted dark:text-dark-muted text-xs">Durasi Bersih</Text>
            <Text className="text-light-text dark:text-dark-text text-lg font-bold mt-1">
              {durationHours} jam
            </Text>
          </View>
          <View className="flex-1 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-4">
            <Text className="text-light-muted dark:text-dark-muted text-xs">Istirahat</Text>
            <Text className="text-light-text dark:text-dark-text text-lg font-bold mt-1">
              {entry.break_minutes} mnt
            </Text>
          </View>
        </View>

        {/* Estimation */}
        <View className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-4 mb-4">
          <Text className="text-light-muted dark:text-dark-muted text-xs">Estimasi Upah</Text>
          <Text className="text-secondary-400 text-2xl font-bold mt-1">
            Rp {estimatedWage.toLocaleString('id-ID')}
          </Text>
          <Text className="text-light-muted dark:text-dark-muted text-xs mt-1">{formulaName}</Text>
        </View>

        {/* Photo Attachment View */}
        {entry.attachment_url && (
          <View className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-4 mb-4">
            <Text className="text-light-muted dark:text-dark-muted text-xs font-bold uppercase tracking-wider mb-2">
              Bukti Foto SPL / Absensi
            </Text>
            <Pressable onPress={() => setIsImageModalVisible(true)} className="relative">
              <Image
                source={{ uri: entry.attachment_url }}
                className="w-full h-48 rounded-xl bg-light-bg dark:bg-dark-bg"
                resizeMode="cover"
              />
              <View className="absolute bottom-2 right-2 bg-black/70 px-3 py-1 rounded-lg flex-row items-center gap-1">
                <Ionicons name="swap-vertical" size={12} color="#fff" />
                <Text className="text-white text-[11px] font-bold">Perbesar</Text>
              </View>
            </Pressable>
          </View>
        )}

        {/* Notes */}
        {entry.notes && (
          <View className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-4 mb-6">
            <Text className="text-light-muted dark:text-dark-muted text-xs mb-1">Catatan</Text>
            <Text className="text-light-text dark:text-dark-text text-sm">{entry.notes}</Text>
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
            className={`flex-1 bg-light-card dark:bg-dark-card border border-red-500/30 rounded-xl py-3.5 items-center flex-row justify-center gap-2 active:opacity-70 ${isDeleting ? 'opacity-50' : ''}`}
          >
            {isDeleting && <ActivityIndicator size="small" color="#ef4444" />}
            <Text className="text-red-400 font-semibold">Hapus</Text>
          </Pressable>
        </View>
      </View>

      {/* Full Screen Image Zoom Modal */}
      {entry.attachment_url && (
        <Modal
          visible={isImageModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsImageModalVisible(false)}
        >
          <View className="flex-1 bg-black/90 justify-center items-center p-4">
            <Pressable
              className="absolute top-12 right-6 z-10 bg-light-card dark:bg-dark-card p-3 rounded-full border border-light-border dark:border-dark-border"
              onPress={() => setIsImageModalVisible(false)}
            >
              <Ionicons name="close" size={20} color="#fff" />
            </Pressable>
            <Image
              source={{ uri: entry.attachment_url }}
              className="w-full h-4/5 rounded-2xl"
              resizeMode="contain"
            />
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}
